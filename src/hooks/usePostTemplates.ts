
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

      // Transform the data to match our PostTemplate interface
      return (data || []).map(template => ({
        ...template,
        placeholders: Array.isArray(template.placeholders) 
          ? template.placeholders as string[]
          : JSON.parse(template.placeholders as string) as string[]
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePostTemplatesByCategory(category: PostTemplate['category']) {
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

      // Transform the data to match our PostTemplate interface
      return (data || []).map(template => ({
        ...template,
        placeholders: Array.isArray(template.placeholders) 
          ? template.placeholders as string[]
          : JSON.parse(template.placeholders as string) as string[]
      }));
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}
