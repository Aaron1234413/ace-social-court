
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export function useLogPrompts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Check if prompt has been shown today
  const { data: shownToday, isLoading } = useQuery({
    queryKey: ['prompt_shown_today', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('log_prompts')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('prompt_type', 'daily_login')
        .gte('created_at', today.toISOString())
        .limit(1);
        
      if (error) {
        console.error('Error checking if prompt shown today:', error);
        return false;
      }
      
      return data && data.length > 0;
    },
    enabled: !!user
  });
  
  // Record prompt display or action
  const logPromptMutation = useMutation({
    mutationFn: async ({ 
      promptType = 'daily_login',
      actionTaken = null 
    }: { 
      promptType?: string; 
      actionTaken?: string | null;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('log_prompts')
        .insert({
          user_id: user.id,
          prompt_type: promptType,
          action_taken: actionTaken
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error logging prompt:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt_shown_today', user?.id] });
    },
    onError: () => {
      // Silent failure for logging - don't disturb user experience
      console.error('Failed to log prompt action');
    }
  });
  
  return {
    shownToday: shownToday || false,
    isLoading,
    logPrompt: logPromptMutation.mutate
  };
}
