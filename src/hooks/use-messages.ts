
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Message } from '@/types/messages';
import { toast } from 'sonner';
import { useMediaUpload } from './use-media-upload';
import { useMessageReactions } from './use-message-reactions';
import { useMessageOperations } from './use-message-operations';

export const useMessages = (conversationId?: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<{message: string} | null>(null);
  
  const {
    mediaFile,
    mediaPreview,
    mediaType,
    uploadProgress,
    setUploadProgress,
    handleMediaSelect,
    clearMedia
  } = useMediaUpload();
  
  const { addReaction, removeReaction } = useMessageReactions(conversationId);
  const { deleteMessage } = useMessageOperations(conversationId);

  // First get the conversation details to identify participants
  const { data: conversation } = useQuery({
    queryKey: ['conversation-details', conversationId],
    queryFn: async () => {
      if (!user || !conversationId) return null;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
        
      if (error) {
        console.error('Error fetching conversation:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user && !!conversationId,
  });

  // Get both participants' IDs for the messages query
  const user1Id = conversation?.user1_id;
  const user2Id = conversation?.user2_id;

  // Now fetch messages for this conversation
  const { data: messages, isLoading: isLoadingMessages, refetch } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!user || !conversationId || !user1Id || !user2Id) return [];

      try {
        console.log(`Fetching messages for conversation: ${conversationId}`);
        
        // Get all messages for this conversation
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${user1Id},recipient_id.eq.${user2Id}),and(sender_id.eq.${user2Id},recipient_id.eq.${user1Id})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          setError({ message: error.message });
          return [];
        }

        console.log(`Fetched ${data.length} messages`);

        // For each message, fetch the sender's profile
        const messagesWithSenders = await Promise.all(
          data.map(async (message) => {
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', message.sender_id)
              .single();

            if (senderError) {
              console.error('Error fetching sender profile:', senderError);
              return {
                ...message,
                sender: null,
                reactions: []
              } as Message;
            }

            // Get reactions for this message
            const { data: reactionsData, error: reactionsError } = await supabase
              .from('message_reactions')
              .select('*')
              .eq('message_id', message.id);

            const reactions = reactionsError ? [] : reactionsData;

            return {
              ...message,
              sender: senderData,
              reactions
            } as Message;
          })
        );

        // Mark any unread messages as read
        const unreadMessages = data.filter(
          message => message.recipient_id === user.id && !message.read
        );

        if (unreadMessages.length > 0) {
          console.log(`Marking ${unreadMessages.length} messages as read`);
          await Promise.all(
            unreadMessages.map(async (message) => {
              const { error: updateError } = await supabase
                .from('direct_messages')
                .update({ read: true })
                .eq('id', message.id);
                
              if (updateError) {
                console.error('Error marking message as read:', updateError);
              }
            })
          );
          
          // After marking messages as read, invalidate conversations to update badges
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }

        return messagesWithSenders;
      } catch (error) {
        console.error('Unexpected error in useMessages:', error);
        setError({ message: error instanceof Error ? error.message : 'Failed to load messages' });
        return [];
      }
    },
    enabled: !!user && !!conversationId && !!user1Id && !!user2Id,
    meta: {
      onError: (error: Error) => {
        console.error('Error in useMessages query:', error);
        setError({ message: error.message });
      }
    },
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    staleTime: 10000,
  });

  // Add real-time subscription for message status updates
  useEffect(() => {
    if (!user || !conversationId) return;
    
    // Set up a subscription to changes in direct_messages table
    const channel = supabase
      .channel('message-status-changes')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${user.id}` // Only listen for messages sent by the current user
        },
        (payload) => {
          console.log('Message status updated:', payload);
          // If the read status was updated, refresh the messages
          if (payload.new.read !== payload.old.read) {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          }
        }
      )
      .subscribe();
      
    console.log('Subscribed to message status changes');
      
    return () => {
      console.log('Unsubscribing from message status changes');
      supabase.removeChannel(channel);
    };
  }, [user, conversationId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !conversationId || !conversation) {
        throw new Error('Missing required data for sending message');
      }

      const recipientId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
      
      console.log(`Sending message to ${recipientId} in conversation ${conversationId}`);
      
      let mediaUrl = null;
      let mediaTypeToSave = null;
      
      // If there's a media file to upload
      if (mediaFile) {
        try {
          setUploadProgress(0);
          const fileExt = mediaFile.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('message_media')
            .upload(filePath, mediaFile, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
          }
          
          // Get public URL
          const { data: publicUrlData } = await supabase.storage
            .from('message_media')
            .getPublicUrl(filePath);
            
          mediaUrl = publicUrlData.publicUrl;
          mediaTypeToSave = mediaType;
          
          console.log('Media uploaded successfully:', mediaUrl);
        } catch (error) {
          console.error('Error processing media:', error);
          throw error;
        }
      }
      
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          media_url: mediaUrl,
          media_type: mediaTypeToSave,
          is_deleted: false
        })
        .select();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      return data;
    },
    onSuccess: () => {
      setNewMessage('');
      clearMedia();
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
      setError({ message: error instanceof Error ? error.message : 'Failed to send message' });
    },
    retry: 2,
  });

  const sendMessage = useCallback(() => {
    if ((newMessage.trim() || mediaFile) && conversationId) {
      sendMessageMutation.mutate(newMessage);
    }
  }, [newMessage, mediaFile, conversationId, sendMessageMutation]);
  
  // Function to retry loading messages when there's an error
  const retryLoadMessages = useCallback(() => {
    setError(null);
    refetch();
  }, [refetch]);

  return {
    messages: messages || [],
    isLoadingMessages,
    error,
    newMessage,
    setNewMessage,
    sendMessage,
    retryLoadMessages,
    isSending: sendMessageMutation.isPending,
    mediaFile,
    mediaPreview,
    mediaType,
    uploadProgress,
    handleMediaSelect,
    clearMedia,
    addReaction,
    removeReaction,
    deleteMessage
  };
};

// Export the other hooks to avoid conflicts
export * from './use-conversations';
export { useCreateConversation } from './use-create-conversation';
