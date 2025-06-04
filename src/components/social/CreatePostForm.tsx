
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { PrivacySelector, PrivacyLevel } from './PrivacySelector';
import { PostTemplateSelector } from './PostTemplateSelector';
import { useUserFollows } from '@/hooks/useUserFollows';
import { PostTemplate } from '@/types/post';
import { Send, Loader2 } from 'lucide-react';

const createPostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(1000, 'Post content must be less than 1000 characters'),
  privacy_level: z.enum(['private', 'friends', 'public', 'coaches']),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

interface CreatePostFormProps {
  onSuccess?: () => void;
}

export function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { followingCount } = useUserFollows();
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(null);

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: '',
      privacy_level: followingCount < 3 ? 'private' : 'friends',
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostFormData) => {
      if (!user) throw new Error('User not authenticated');

      const postData = {
        user_id: user.id,
        content: data.content,
        privacy_level: data.privacy_level,
        template_id: selectedTemplate?.id || null,
        is_auto_generated: false,
        engagement_score: 0,
      };

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      form.reset();
      setSelectedTemplate(null);
      toast.success('Post created successfully!');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    },
  });

  const handleTemplateSelect = (template: PostTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      form.setValue('content', template.content_template);
    }
  };

  const onSubmit = (data: CreatePostFormData) => {
    createPostMutation.mutate(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Create New Post</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PostTemplateSelector
              selectedTemplateId={selectedTemplate?.id}
              onTemplateSelect={handleTemplateSelect}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's on your mind about tennis?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacy_level"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PrivacySelector
                      value={field.value as PrivacyLevel}
                      onValueChange={field.onChange}
                      followingCount={followingCount}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Post...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Post
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
