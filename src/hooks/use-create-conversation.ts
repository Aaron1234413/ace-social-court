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
