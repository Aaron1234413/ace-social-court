
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Conversation } from '@/components/messages/types';
import { toast } from 'sonner';

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch all conversations for the current user
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];
      
      // Get conversations where current user is either user1 or user2
      const { data, error } = await supabase
        .from('conversations')
        .select('*, profiles!conversations_user2_id_fkey(id, username, full_name, avatar_url)')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }
      
      // Format conversations to always show the other user's info
      return data.map((conversation: any) => {
        const isUser1 = conversation.user1_id === user.id;
        const otherUserId = isUser1 ? conversation.user2_id : conversation.user1_id;
        const otherUser = isUser1 ? conversation.profiles : null;
        
        // If other user profile not loaded, we need to fetch it manually
        // This happens when current user is user2, not user1
        if (!otherUser && otherUserId) {
          return {
            ...conversation,
            other_user: null // Will be fetched separately
          };
        }
        
        return {
          ...conversation,
          other_user: otherUser
        } as Conversation;
      });
    },
    enabled: !!user
  });
  
  // If any conversations are missing other_user info, fetch them
  const conversationsWithOtherUsers = useQuery({
    queryKey: ['conversations_with_users', conversations],
    queryFn: async () => {
      if (!conversations) return [];
      
      const incompleteConversations = conversations.filter(
        (conv: Conversation) => !conv.other_user
      );
      
      if (incompleteConversations.length === 0) {
        return conversations;
      }
      
      const updatedConversations = [...conversations];
      
      await Promise.all(
        incompleteConversations.map(async (conversation) => {
          const otherUserId = conversation.user1_id === user?.id 
            ? conversation.user2_id 
            : conversation.user1_id;
            
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();
            
          if (!error && profileData) {
            const index = updatedConversations.findIndex(c => c.id === conversation.id);
            if (index !== -1) {
              updatedConversations[index] = {
                ...updatedConversations[index],
                other_user: profileData
              };
            }
          }
        })
      );
      
      return updatedConversations;
    },
    enabled: !!conversations && conversations.length > 0
  });
  
  // Fetch last messages for each conversation
  const { data: conversationsWithLastMessages } = useQuery({
    queryKey: ['conversations_with_messages', conversationsWithOtherUsers.data],
    queryFn: async () => {
      if (!conversationsWithOtherUsers.data) return [];
      
      const withLastMessages = await Promise.all(
        conversationsWithOtherUsers.data.map(async (conversation: Conversation) => {
          const { data, error } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${conversation.user1_id},recipient_id.eq.${conversation.user2_id}),and(sender_id.eq.${conversation.user2_id},recipient_id.eq.${conversation.user1_id})`)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (error || !data || data.length === 0) {
            return conversation;
          }
          
          return {
            ...conversation,
            last_message: data[0]
          };
        })
      );
      
      return withLastMessages;
    },
    enabled: !!conversationsWithOtherUsers.data && conversationsWithOtherUsers.data.length > 0
  });
  
  // Count unread messages for each conversation - Fix the unread count query
  const { data: unreadCounts } = useQuery({
    queryKey: ['unread_counts', user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      // Use a different approach to count unread messages per conversation
      const { data, error } = await supabase
        .from('direct_messages')
        .select('id, sender_id, recipient_id')
        .eq('recipient_id', user.id)
        .eq('read', false)
        .eq('is_deleted', false);
        
      if (error) {
        console.error('Error counting unread messages:', error);
        return {};
      }
      
      // Process the data to get counts by conversation
      const counts: Record<string, number> = {};
      if (data) {
        // Group messages by sender_id (which corresponds to the conversation with that user)
        data.forEach(message => {
          const senderId = message.sender_id;
          counts[senderId] = (counts[senderId] || 0) + 1;
        });
      }
      
      return counts;
    },
    enabled: !!user
  });
  
  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // First delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('direct_messages')
        .update({ is_deleted: true })
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationId}),and(recipient_id.eq.${user.id},sender_id.eq.${conversationId})`);
        
      if (messagesError) {
        console.error('Error deleting conversation messages:', messagesError);
        throw messagesError;
      }
      
      // Then delete the conversation itself
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        
      if (conversationError) {
        console.error('Error deleting conversation:', conversationError);
        throw conversationError;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation deleted');
    },
    onError: () => {
      toast.error('Failed to delete conversation');
    }
  });
  
  return {
    // Fix: Don't try to access .data property here
    conversations: conversationsWithLastMessages || [],
    isLoading: isLoading || conversationsWithOtherUsers.isLoading,
    unreadCounts: unreadCounts || {},
    deleteConversation: deleteConversationMutation.mutate
  };
}
