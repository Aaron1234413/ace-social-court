
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface CreateConversationCallbacks {
  onSuccess?: (conversationId: string) => void;
  onError?: (error: any) => void;
  onSettled?: () => void;
}

export const useCreateConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user || !otherUserId) {
        throw new Error('Missing user IDs');
      }

      console.log(`Creating conversation between ${user.id} and ${otherUserId}`);
      
      // First check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking for existing conversation:', checkError);
        throw checkError;
      }
      
      // If conversation exists, return it
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        return existingConversation;
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

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      console.log('Conversation created successfully');
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error in useCreateConversation mutation:', error);
    },
    retry: 1, // Retry once before failing
  });

  return {
    createConversation: (otherUserId: string, callbacks?: CreateConversationCallbacks) => {
      createConversationMutation.mutate(otherUserId, {
        onSuccess: (data) => {
          if (callbacks?.onSuccess) {
            callbacks.onSuccess(data.id);
          }
        },
        onError: (error) => {
          if (callbacks?.onError) {
            callbacks.onError(error);
          }
        },
        onSettled: () => {
          if (callbacks?.onSettled) {
            callbacks.onSettled();
          }
        }
      });
    },
    isCreating: createConversationMutation.isPending
  };
};
