
import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast, showSuccessToast, showErrorToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { ImageIcon, X, Sparkles, Brain, Zap, MessageSquare, Camera, Send } from 'lucide-react';
import { uploadFileWithProgress } from '@/utils/mediaUtils';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Post } from '@/types/post';
import { useAutoPostGeneration } from '@/hooks/useAutoPostGeneration';
import { AutoPostService, PostSuggestion } from '@/services/AutoPostService';
import { CoachPromptSystem } from '@/services/CoachPromptSystem';
import { ContextPromptEngine } from '@/services/ContextPromptEngine';
import { useUserFollows } from '@/hooks/useUserFollows';

const postSchema = z.object({
  content: z.string().min(3, { message: "Post content must be at least 3 characters." }),
  privacy_level: z.enum(['public', 'friends', 'coaches', 'public_highlights']).default('public').optional(),
  template_id: z.string().optional(),
});

interface PostComposerProps {
  onSuccess?: (post?: Post) => void;
  className?: string;
  sessionData?: any; // For session integration
  matchData?: any; // For match integration
}

export function PostComposer({ onSuccess, className, sessionData, matchData }: PostComposerProps) {
  const { user, profile } = useAuth();
  const { followingCount } = useUserFollows();
  const [showComposer, setShowComposer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<PostSuggestion[]>([]);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const { toast } = useToast();

  const { suggestions, isGenerating, generateSuggestions } = useAutoPostGeneration();

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      privacy_level: followingCount < 3 ? 'public_highlights' : 'public',
      template_id: null,
    },
  });

  // Auto-suggest privacy level based on follow count
  useEffect(() => {
    if (followingCount < 3) {
      form.setValue('privacy_level', 'public_highlights');
    } else {
      form.setValue('privacy_level', 'public');
    }
  }, [followingCount, form]);

  // Generate AI suggestions when session/match data is available
  useEffect(() => {
    if (sessionData && user) {
      generateSuggestions(sessionData);
    }
  }, [sessionData, user, generateSuggestions]);

  // Generate contextual prompts
  useEffect(() => {
    if (user && profile) {
      const promptEngine = ContextPromptEngine.getInstance();
      const coachSystem = CoachPromptSystem.getInstance();
      
      // Create mock post context for prompt generation
      const mockPost = {
        content: form.watch('content') || '',
        user_id: user.id,
        author: profile
      } as Post;

      const context = ContextPromptEngine.buildContext(mockPost, user.id, profile.user_type);
      
      if (profile.user_type === 'coach') {
        const prompt = coachSystem.generateCoachPrompt(mockPost, context, profile.full_name);
        setCurrentPrompt(prompt.placeholder);
      } else {
        const prompt = promptEngine.generatePrompt(mockPost, context, profile.full_name);
        setCurrentPrompt(prompt.placeholder);
      }
    }
  }, [user, profile, form.watch('content')]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showErrorToast("File too large", "Please select a file smaller than 10MB.");
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleAiSuggestionSelect = (suggestion: PostSuggestion) => {
    form.setValue('content', suggestion.content);
    form.setValue('privacy_level', suggestion.privacyLevel);
    if (suggestion.template?.id) {
      form.setValue('template_id', suggestion.template.id);
    }
    setShowAiHelp(false);
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
        try {
          mediaUrl = await uploadFileWithProgress(
            mediaFile,
            'posts',
            user.id
          );
          mediaType = mediaFile.type;
        } catch (uploadError) {
          console.error('Error uploading media:', uploadError);
          showErrorToast("Media upload failed", "Please try again later.");
          setIsSubmitting(false);
          return;
        }
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
          profiles!inner (
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
      setAiSuggestions([]);
      
      // Call success callback with the created post
      onSuccess?.(createdPost);

    } catch (error) {
      console.error('Error creating post:', error);
      showErrorToast("Error creating post", "Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrivacyDescription = (level: string) => {
    switch (level) {
      case 'public_highlights':
        return `Share with the community${followingCount < 3 ? ' (recommended for new users)' : ''}`;
      case 'public':
        return 'Everyone can see this post';
      case 'friends':
        return 'Only people you follow can see this';
      case 'coaches':
        return 'Only your coaches can see this';
      default:
        return 'Select privacy level';
    }
  };

  return (
    <Card className={`border-2 border-primary/10 shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Share Your Tennis Journey
              </h3>
              <p className="text-sm text-muted-foreground">
                {profile?.user_type === 'coach' ? 'Share insights with your students' : 'Connect with the tennis community'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Ready
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowComposer(!showComposer)}
              className="text-primary hover:bg-primary/10"
            >
              {showComposer ? 'Minimize' : 'Create Post'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {showComposer && (
        <CardContent className="pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* AI Suggestions Section */}
              {suggestions.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">AI Suggestions</span>
                      <Badge variant="outline" className="text-xs">
                        Based on your {sessionData ? 'session' : matchData ? 'match' : 'activity'}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAiHelp(!showAiHelp)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      {showAiHelp ? 'Hide' : 'Show'} Suggestions
                    </Button>
                  </div>
                  
                  {showAiHelp && (
                    <div className="space-y-2">
                      {suggestions.map((suggestion) => (
                        <div 
                          key={suggestion.id}
                          className="bg-white rounded-md p-3 border border-purple-100 cursor-pointer hover:border-purple-300 transition-colors"
                          onClick={() => handleAiSuggestionSelect(suggestion)}
                        >
                          <p className="text-sm text-gray-800">{suggestion.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.template.category}
                            </Badge>
                            <span className="text-xs text-purple-600">
                              {Math.round(suggestion.confidence * 100)}% match
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder={currentPrompt || "Share your tennis experience..."}
                        className="min-h-[120px] resize-none border-2 border-gray-200 focus:border-primary transition-colors text-base leading-relaxed"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Media Upload/Preview */}
              {mediaPreview ? (
                <div className="relative">
                  <div className="rounded-lg overflow-hidden border-2 border-dashed border-gray-200">
                    {mediaFile?.type.startsWith('image/') ? (
                      <img src={mediaPreview} alt="Media Preview" className="w-full max-h-64 object-cover" />
                    ) : (
                      <video src={mediaPreview} controls className="w-full max-h-64" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full p-0"
                    onClick={handleRemoveMedia}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Label htmlFor="media" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Add photo or video</span>
                    <span className="text-xs text-muted-foreground">Share your tennis moments</span>
                    <input
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
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <span>Who can see this post?</span>
                      {followingCount < 3 && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          Growing your network
                        </Badge>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-gray-200 focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public_highlights">
                          🌟 Community Highlights
                        </SelectItem>
                        <SelectItem value="public">
                          🌍 Public
                        </SelectItem>
                        <SelectItem value="friends">
                          👥 Friends Only
                        </SelectItem>
                        {profile?.user_type === 'player' && (
                          <SelectItem value="coaches">
                            🎾 Coaches Only
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      {getPrivacyDescription(field.value || 'public')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>AI Enhanced</span>
                  </div>
                  {isGenerating && (
                    <div className="flex items-center gap-1 text-sm text-purple-600">
                      <div className="animate-spin h-3 w-3 border border-purple-600 border-t-transparent rounded-full"></div>
                      <span>Generating suggestions...</span>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.watch('content')?.trim()}
                  className="px-6 bg-primary hover:bg-primary/90 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Share Post
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  );
}
