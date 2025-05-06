
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMessageOperations = (otherUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Function to delete a message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // Soft delete - update is_deleted flag
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_deleted: true, content: "This message was deleted" })
        .match({ id: messageId, sender_id: user.id });
        
      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success("Message deleted");
    },
    onError: (error) => {
      toast.error('Failed to delete message');
      console.error('Error deleting message:', error);
    }
  });

  return {
    deleteMessage: deleteMessageMutation.mutate
  };
};
