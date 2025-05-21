
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
      
      try {
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

        // Ensure consistent ordering of user IDs (user1_id is always lexicographically smaller)
        const user1 = user.id < otherUserId ? user.id : otherUserId;
        const user2 = user.id < otherUserId ? otherUserId : user.id;

        const { data, error } = await supabase
          .from('conversations')
          .insert({
            user1_id: user1,
            user2_id: user2,
            last_message_at: new Date().toISOString()
          })
          .select();

        if (error) {
          // If we get a duplicate key error, try to fetch the existing conversation
          if (error.message.includes('duplicate key')) {
            console.warn('Duplicate key error while creating conversation, trying to fetch existing');
            const { data: retryData, error: retryError } = await supabase
              .from('conversations')
              .select('id')
              .eq('user1_id', user1)
              .eq('user2_id', user2)
              .maybeSingle();
            
            if (retryError) {
              console.error('Error fetching existing conversation after duplicate key error:', retryError);
              throw retryError;
            }
            
            if (retryData) {
              console.log('Found existing conversation on retry:', retryData.id);
              return retryData;
            } else {
              throw new Error('Failed to find existing conversation after duplicate key error');
            }
          } else {
            console.error('Error creating conversation:', error);
            throw error;
          }
        }
        
        console.log('Conversation created successfully:', data[0]?.id);
        return data[0];
      } catch (error) {
        console.error('Error in conversation creation process:', error);
        throw error;
      }
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
