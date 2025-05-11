
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageReaction } from '@/components/messages/types';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMessageReactions = (otherUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Function to add reaction to message
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, reactionType }: { messageId: string, reactionType: MessageReaction['reaction_type'] }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Return a placeholder for now since we don't have the table yet
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
      
      // Return a placeholder for now since we don't have the table yet
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

  return {
    addReaction: (messageId: string, type: MessageReaction['reaction_type']) => 
      addReactionMutation.mutate({ messageId, reactionType: type }),
    removeReaction: (messageId: string, reactionId: string) => 
      removeReactionMutation.mutate({ messageId, reactionId }),
    isAddingReaction: addReactionMutation.isPending,
    isRemovingReaction: removeReactionMutation.isPending
  };
};
