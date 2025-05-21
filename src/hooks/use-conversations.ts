
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Conversation } from '@/components/messages/types';

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // Get conversations where current user is involved
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false });
          
        if (conversationsError) {
          throw new Error(conversationsError.message);
        }
        
        // For each conversation, get the other user's profile and last message
        const conversationsWithDetails = await Promise.all(
          conversationsData.map(async (conversation) => {
            const otherUserId = conversation.user1_id === user.id
              ? conversation.user2_id
              : conversation.user1_id;
              
            // Get other user's profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', otherUserId)
              .single();
              
            if (profileError) {
              console.error('Error fetching profile:', profileError);
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
            
            // Get last message
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

            // Count unread messages
            const { count: unreadCount, error: countError } = await supabase
              .from('direct_messages')
              .select('*', { count: 'exact', head: true })
              .eq('recipient_id', user.id)
              .eq('sender_id', otherUserId)
              .eq('read', false);

            if (countError) {
              console.error('Error counting unread messages:', countError);
            } else if (unreadCount && unreadCount > 0) {
              // Update unread counts
              setUnreadCounts(prev => ({
                ...prev,
                [conversation.id]: unreadCount
              }));
            }
            
            return {
              ...conversation,
              other_user: profileData,
              last_message: lastMessageData
            } as Conversation;
          })
        );
        
        return conversationsWithDetails;
      } catch (error) {
        console.error('Error in useConversations:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Set up realtime subscription to update read status
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('conversation-updates')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}` // Only listen for messages sent to the current user
        },
        (payload) => {
          console.log('Message updated:', payload);
          // If read status changed, refresh conversations
          if (payload.new.read !== payload.old.read) {
            refetch();
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}` // New messages to the current user
        },
        (payload) => {
          console.log('New message received:', payload);
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);
  
  // Add a function to delete conversation
  const deleteConversation = async (conversationId: string) => {
    // In this implementation, we don't actually delete the conversation record,
    // just mark all messages as deleted
    if (!user) return false;
    
    try {
      const conversation = data?.find(c => c.id === conversationId);
      if (!conversation) return false;
      
      const otherUserId = conversation.user1_id === user.id
        ? conversation.user2_id
        : conversation.user1_id;
      
      // Mark all messages as deleted
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_deleted: true })
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`);
      
      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }
      
      // Refresh conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      return true;
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      return false;
    }
  };

  return {
    conversations: data || [],
    isLoading,
    error,
    unreadCounts,
    deleteConversation,
    refetch
  };
}

export function useCreateConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  const createConversation = async (otherUserId: string, options?: { onSuccess?: Function, onError?: (error: any) => void }) => {
    if (!user || !otherUserId) {
      throw new Error('Missing user information');
    }
    
    setIsCreating(true);
    
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .maybeSingle();
        
      if (checkError) {
        throw new Error(checkError.message);
      }
      
      // If conversation exists, return it
      if (existingConversation) {
        if (options?.onSuccess) options.onSuccess(existingConversation.id);
        return existingConversation.id;
      }
      
      // Create new conversation with user1_id < user2_id (for consistency)
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id < otherUserId ? user.id : otherUserId,
          user2_id: user.id < otherUserId ? otherUserId : user.id,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        throw new Error(createError.message);
      }
      
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      if (options?.onSuccess) options.onSuccess(newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      if (options?.onError) options.onError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };
  
  return { createConversation, isCreating };
}
