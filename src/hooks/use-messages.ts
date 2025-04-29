
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Message, Conversation } from '@/components/messages/types';
import { toast } from 'sonner';

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];

      // Get all conversations where current user is either user1 or user2
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        return [];
      }

      // For each conversation, get the other user's profile
      const conversationsWithProfiles = await Promise.all(
        conversationsData.map(async (conversation) => {
          const otherUserId = conversation.user1_id === user.id
            ? conversation.user2_id
            : conversation.user1_id;

          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          // Also get the last message for this conversation
          const { data: lastMessageData } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`sender_id.eq.${conversation.user1_id},sender_id.eq.${conversation.user2_id}`)
            .or(`recipient_id.eq.${conversation.user1_id},recipient_id.eq.${conversation.user2_id}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conversation,
            other_user: profileData,
            last_message: lastMessageData || null
          };
        })
      );

      return conversationsWithProfiles as Conversation[];
    },
    enabled: !!user
  });

  return {
    conversations: conversations || [],
    isLoadingConversations
  };
};

export const useMessages = (otherUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', otherUserId],
    queryFn: async () => {
      if (!user || !otherUserId) return [];

      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:sender_id(username, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      // Mark any unread messages as read
      const unreadMessages = data.filter(
        message => message.recipient_id === user.id && !message.read
      );

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(async (message) => {
            await supabase
              .from('direct_messages')
              .update({ read: true })
              .eq('id', message.id);
          })
        );
      }

      return data as Message[];
    },
    enabled: !!user && !!otherUserId
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !otherUserId || !content.trim()) {
        throw new Error('Missing required data for sending message');
      }

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: otherUserId,
          content,
        })
        .select();

      if (error) throw error;
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

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error('Failed to create conversation');
      console.error('Error creating conversation:', error);
    }
  });

  return {
    createConversation: createConversationMutation.mutate,
    isCreating: createConversationMutation.isPending
  };
};
