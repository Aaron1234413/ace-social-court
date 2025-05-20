
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Conversation } from '@/types/messages';

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
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

  return {
    conversations: data || [],
    isLoading,
    error
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
