import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Message, Conversation, MessageReaction } from '@/components/messages/types';
import { toast } from 'sonner';

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<{message: string} | null>(null);

  const { data: conversations, isLoading: isLoadingConversations, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];

      try {
        console.log("Fetching conversations for user:", user.id);
        
        // Get all conversations where current user is either user1 or user2
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false });

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
          setError({ message: conversationsError.message });
          return [];
        }

        // For each conversation, get the other user's profile
        const conversationsWithProfiles = await Promise.all(
          conversationsData.map(async (conversation) => {
            const otherUserId = conversation.user1_id === user.id
              ? conversation.user2_id
              : conversation.user1_id;

            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', otherUserId)
              .single();

            if (profileError) {
              console.error('Error fetching profile for user:', otherUserId, profileError);
              return {
                ...conversation,
                other_user: { 
                  id: otherUserId,
                  username: 'Unknown User',
                  full_name: null,
                  avatar_url: null 
                },
                last_message: null
              };
            }

            // Also get the last message for this conversation
            const { data: lastMessageData, error: messageError } = await supabase
              .from('direct_messages')
              .select('*')
              .or(`and(sender_id.eq.${conversation.user1_id},recipient_id.eq.${conversation.user2_id}),and(sender_id.eq.${conversation.user2_id},recipient_id.eq.${conversation.user1_id})`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (messageError) {
              console.error('Error fetching last message:', messageError);
            }

            return {
              ...conversation,
              other_user: profileData,
              last_message: lastMessageData || null
            };
          })
        );

        console.log("Fetched conversations with profiles:", conversationsWithProfiles.length);
        return conversationsWithProfiles as Conversation[];
      } catch (error) {
        console.error('Unexpected error in useConversations:', error);
        setError({ message: error instanceof Error ? error.message : 'Failed to load conversations' });
        return [];
      }
    },
    enabled: !!user,
    meta: {
      onError: (error: Error) => {
        console.error('Error in useConversations query:', error);
        setError({ message: error.message });
      }
    },
    retry: 2,
    staleTime: 30000, // Increase stale time to 30 seconds to reduce network requests
    gcTime: 300000, // Cache for 5 minutes
  });

  return {
    conversations: conversations || [],
    isLoadingConversations,
    error,
    refetch
  };
};

export const useMessages = (otherUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<{message: string} | null>(null);

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

            return {
              ...message,
              sender: senderData,
              reactions: [] // Add empty reactions array
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
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      setUploadProgress(0);
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
  
  // Function to handle media file selection
  const handleMediaSelect = useCallback((file: File, type: 'image' | 'video') => {
    setMediaFile(file);
    setMediaType(type);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Function to clear selected media
  const clearMedia = useCallback(() => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
  }, []);
  
  // Comment out reactions mutations since we don't have the table yet
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, reactionType }: { messageId: string, reactionType: MessageReaction['reaction_type'] }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Return a placeholder for now
      return [{id: 'placeholder-id'}];
      
      // Original code commented out since table doesn't exist yet:
      /*
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          reaction_type: reactionType
        })
        .select();
        
      if (error) {
        console.error('Error adding reaction:', error);
        throw error;
      }
      
      return data;
      */
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
    },
    onError: (error) => {
      toast.error('Failed to add reaction');
      console.error('Error adding reaction:', error);
    }
  });
  
  // Function to remove reaction from message
  const removeReactionMutation = useMutation({
    mutationFn: async ({ messageId, reactionId }: { messageId: string, reactionId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Return a placeholder for now
      return true;
      
      // Original code commented out since table doesn't exist yet:
      /*
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .match({ id: reactionId, user_id: user.id });
        
      if (error) {
        console.error('Error removing reaction:', error);
        throw error;
      }
      */
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
    },
    onError: (error) => {
      toast.error('Failed to remove reaction');
      console.error('Error removing reaction:', error);
    }
  });
  
  // Function to delete a message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // Soft delete - update is_deleted flag
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_deleted: true, content: "This message was deleted" })
        .match({ id: messageId, sender_id: user.id });
        
      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success("Message deleted");
    },
    onError: (error) => {
      toast.error('Failed to delete message');
      console.error('Error deleting message:', error);
    }
  });
  
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
    addReaction: addReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate
  };
};

export const useCreateConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user || !otherUserId) {
        throw new Error('Missing user IDs');
      }

      console.log(`Creating conversation between ${user.id} and ${otherUserId}`);
      
      // We'll add this check to make sure user1_id is lexicographically smaller than user2_id
      const user1 = user.id < otherUserId ? user.id : otherUserId;
      const user2 = user.id < otherUserId ? otherUserId : user.id;

      const { data, error } = await supabase
        .from('conversations')
        .upsert({
          user1_id: user1,
          user2_id: user2,
          last_message_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      console.log('Conversation created/updated successfully');
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      // Don't show toast here, handled by the component
      console.error('Error creating conversation:', error);
    },
    retry: 1, // Retry once before failing
  });

  return {
    createConversation: createConversationMutation.mutate,
    isCreating: createConversationMutation.isPending
  };
};
