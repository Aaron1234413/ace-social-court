import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { ImageIcon, X } from 'lucide-react';
import { storage } from '@/integrations/supabase/storage';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Post } from '@/types/post';

const postSchema = z.object({
  content: z.string().min(3, { message: "Post content must be at least 3 characters." }),
  privacy_level: z.enum(['public', 'friends']).default('public').optional(),
  template_id: z.string().optional(),
});

interface PostComposerProps {
  onSuccess?: (post?: Post) => void;
  className?: string;
}

export function PostComposer({ onSuccess, className }: PostComposerProps) {
  const { user, profile } = useAuth();
  const [showComposer, setShowComposer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const { toast, showSuccessToast, showErrorToast } = useToast();

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      privacy_level: 'public',
      template_id: null,
    },
  });

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (values: z.infer<typeof postSchema>) => {
    if (!user) {
      showErrorToast("Authentication required", "Please sign in to create posts.");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
        
        const { publicUrl, error: uploadError } = await storage
          .upload(filePath, mediaFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading media:', uploadError);
          showErrorToast("Media upload failed", "Please try again later.");
          setIsSubmitting(false);
          return;
        }

        mediaUrl = publicUrl;
        mediaType = mediaFile.type;
      }

      const postData = {
        content: values.content,
        user_id: user.id,
        privacy_level: values.privacy_level || 'public',
        media_url: mediaUrl,
        media_type: mediaType,
        template_id: values.template_id || null,
        is_auto_generated: false
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          *,
          profiles!posts_user_id_fkey (
            full_name,
            username,
            avatar_url,
            user_type
          )
        `)
        .single();

      if (error) throw error;

      // Transform the response to match our Post type
      const createdPost: Post = {
        ...data,
        author: data.profiles ? {
          full_name: data.profiles.full_name,
          user_type: data.profiles.user_type,
          avatar_url: data.profiles.avatar_url
        } : null,
        likes_count: 0,
        comments_count: 0
      };

      showSuccessToast("Post created!", "Your post has been shared successfully.");
      
      form.reset();
      setMediaPreview(null);
      setMediaFile(null);
      setShowComposer(false);
      
      // Call success callback with the created post
      onSuccess?.(createdPost);

    } catch (error) {
      console.error('Error creating post:', error);
      showErrorToast("Error creating post", "Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold">Create Post</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowComposer(!showComposer)}>
          {showComposer ? 'Collapse' : 'Expand'}
        </Button>
      </CardHeader>
      {showComposer && (
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What's on your mind?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Media Upload */}
              {mediaPreview ? (
                <div className="relative">
                  <img src={mediaPreview} alt="Media Preview" className="rounded-md max-h-64 w-full object-cover" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background hover:bg-secondary rounded-full"
                    onClick={handleRemoveMedia}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Label htmlFor="media" className="cursor-pointer flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    <span>Upload Media</span>
                    <Input
                      type="file"
                      id="media"
                      className="hidden"
                      onChange={handleMediaChange}
                      accept="image/*, video/*"
                    />
                  </Label>
                </div>
              )}

              <FormField
                control={form.control}
                name="privacy_level"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Privacy Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a privacy level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Who can see this post?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Posting..." : "Share Post"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  );
}
