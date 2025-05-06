import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Message, Conversation } from '@/components/messages/types';
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
    staleTime: 10000 // 10 seconds
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
  const [error, setError] = useState<{message: string} | null>(null);

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
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
                sender: null
              } as Message;
            }

            return {
              ...message,
              sender: senderData
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
    retry: 2
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !otherUserId || !content.trim()) {
        throw new Error('Missing required data for sending message');
      }

      console.log(`Sending message to ${otherUserId}: ${content.substring(0, 20)}...`);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: otherUserId,
          content,
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
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
      setError({ message: error instanceof Error ? error.message : 'Failed to send message' });
    }
  });

  const sendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage);
    }
  };

  return {
    messages: messages || [],
    isLoadingMessages,
    error,
    newMessage,
    setNewMessage,
    sendMessage,
    isSending: sendMessageMutation.isPending
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
    }
  });

  return {
    createConversation: createConversationMutation.mutate,
    isCreating: createConversationMutation.isPending
  };
};
