
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostTemplate } from '@/types/post';

export function usePostTemplates() {
  return useQuery({
    queryKey: ['post-templates'],
    queryFn: async (): Promise<PostTemplate[]> => {
      const { data, error } = await supabase
        .from('post_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching post templates:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePostTemplatesByCategory(category: string) {
  return useQuery({
    queryKey: ['post-templates', category],
    queryFn: async (): Promise<PostTemplate[]> => {
      const { data, error } = await supabase
        .from('post_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching templates by category:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}
