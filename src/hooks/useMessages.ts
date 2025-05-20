
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Message } from '@/types/messages';
import { toast } from 'sonner';

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<{message: string} | null>(null);
  
  // Fetch messages for the given conversation
  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!user || !conversationId) return [];
      
      try {
        // Find the other user in the conversation
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();
          
        if (conversationError) {
          throw new Error(conversationError.message);
        }
        
        const otherUserId = conversationData.user1_id === user.id
          ? conversationData.user2_id
          : conversationData.user1_id;
          
        // Get messages between current user and other user
        const { data: messagesData, error: messagesError } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
          
        if (messagesError) {
          throw new Error(messagesError.message);
        }
        
        // For each message, get the sender's profile
        const messagesWithSenders = await Promise.all(
          messagesData.map(async (message) => {
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
        
        // Mark unread messages as read if they were sent to current user
        const unreadMessages = messagesData.filter(
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
          
          // Update conversations to refresh unread badges
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
        
        return messagesWithSenders;
      } catch (error: any) {
        setError({ message: error.message });
        throw error;
      }
    },
    enabled: !!user && !!conversationId,
    staleTime: 5000,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !conversationId || !content.trim()) {
        throw new Error('Missing required data for sending message');
      }
      
      try {
        // Get the other user ID from the conversation
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();
          
        if (conversationError) {
          throw new Error(conversationError.message);
        }
        
        const recipientId = conversationData.user1_id === user.id
          ? conversationData.user2_id
          : conversationData.user1_id;
        
        // Insert the message
        const { data, error } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            recipient_id: recipientId,
            content,
            read: false
          })
          .select();
          
        if (error) {
          throw new Error(error.message);
        }
        
        // Update conversation last_message_at
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
        
        return data;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error('Failed to send message');
      setError({ message: error instanceof Error ? error.message : 'Failed to send message' });
    }
  });

  // Send message function
  const sendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage);
    }
  };

  return {
    messages: data || [],
    isLoading,
    error,
    newMessage,
    setNewMessage,
    sendMessage,
    isSending: sendMessageMutation.isPending
  };
}
