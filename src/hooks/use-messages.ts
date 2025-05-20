
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Message } from '@/components/messages/types';
import { toast } from 'sonner';
import { useMediaUpload } from './use-media-upload';
import { useMessageReactions } from './use-message-reactions';
import { useMessageOperations } from './use-message-operations';

export const useMessages = (otherUserId?: string) => {
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
  
  const { addReaction, removeReaction } = useMessageReactions(otherUserId);
  const { deleteMessage } = useMessageOperations(otherUserId);

  const { data: messages, isLoading: isLoadingMessages, refetch } = useQuery({
    queryKey: ['messages', otherUserId],
    queryFn: async () => {
      if (!user || !otherUserId) return [];

      try {
        console.log("Fetching messages between:", user.id, "and", otherUserId);
        
        // First, get the messages between current user and other user
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
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
                reactions: [] // Add empty reactions array
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
    enabled: !!user && !!otherUserId,
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

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !otherUserId) {
        throw new Error('Missing required data for sending message');
      }

      console.log(`Sending message to ${otherUserId}: ${content.substring(0, 20)}...`);
      
      let mediaUrl = null;
      let mediaTypeToSave = null;
      
      // If there's a media file to upload
      if (mediaFile) {
        try {
          setUploadProgress(0);
          const fileExt = mediaFile.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}.${fileExt}`;
          
          // Fix FileOptions type issue by removing onUploadProgress
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
          recipient_id: otherUserId,
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
      
      return data;
    },
    onSuccess: () => {
      setNewMessage('');
      clearMedia();
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
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
    if (newMessage.trim() || mediaFile) {
      sendMessageMutation.mutate(newMessage);
    }
  }, [newMessage, mediaFile, sendMessageMutation]);
  
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

// Export the other hooks to maintain backward compatibility
export * from './use-conversations';
export * from './use-create-conversation';
