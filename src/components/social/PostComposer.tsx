
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
import { ImageIcon, X, Sparkles, Brain, Zap, MessageSquare, Camera, Send, Users, Globe, Star, Trophy, Settings, Edit3, Lock, Heart, Target } from 'lucide-react';
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
import { MatchPrivacySelector, MatchPrivacyLevel } from './MatchPrivacySelector';
import { MatchContentTemplateService } from '@/services/MatchContentTemplateService';
import { useEnhancedAutoPostGeneration } from '@/hooks/useEnhancedAutoPostGeneration';
import { EnhancedMatchSuggestions } from './EnhancedMatchSuggestions';
import { EnhancedPostSuggestion } from '@/services/EnhancedAutoPostService';
import { QuickShareButtons } from './QuickShareButtons';
import { UserSharingPreferences } from './UserSharingPreferences';
import { ContentCustomizationPanel } from './ContentCustomizationPanel';

// Helper function to transform legacy privacy levels to new simplified ones
const transformPrivacyLevel = (level: string): 'private' | 'public' | 'public_highlights' => {
  switch (level) {
    case 'public':
      return 'public';
    case 'public_highlights':
      return 'public_highlights';
    case 'friends':
    case 'coaches':
    case 'private':
    default:
      return 'private';
  }
};

// Define privacy level icons and colors for match suggestions
const privacyLevelIcons = {
  'private': Lock,
  'basic': Heart,
  'summary': Trophy,
  'detailed': Target,
  'full': Brain,
};

const privacyLevelColors = {
  'private': 'text-gray-600 bg-gray-50',
  'basic': 'text-blue-600 bg-blue-50',
  'summary': 'text-green-600 bg-green-50',
  'detailed': 'text-purple-600 bg-purple-50',
  'full': 'text-orange-600 bg-orange-50',
};

const postSchema = z.object({
  content: z.string().min(3, { message: "Post content must be at least 3 characters." }),
  privacy_level: z.enum(['public', 'private', 'public_highlights']).default('public').optional(),
  template_id: z.string().nullable().optional(),
});

interface PostComposerProps {
  onSuccess?: (post?: Post) => void;
  className?: string;
  sessionData?: any;
  matchData?: any;
}

export function PostComposer({ onSuccess, className, sessionData, matchData }: PostComposerProps) {
  const { user, profile } = useAuth();
  const { followingCount } = useUserFollows();
  const [showComposer, setShowComposer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const { toast } = useToast();

  // Add match privacy level state
  const [matchPrivacyLevel, setMatchPrivacyLevel] = useState<MatchPrivacyLevel>('basic');

  const { suggestions, isGenerating, generateSuggestions } = useAutoPostGeneration();

  // Add new state for Phase 3 features
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<EnhancedPostSuggestion | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [sharingPreferences, setSharingPreferences] = useState<any>(null);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      privacy_level: followingCount < 3 ? 'public_highlights' : 'public',
      template_id: null,
    },
  });

  // Auto-expand composer when match data is provided
  useEffect(() => {
    if (matchData) {
      setShowComposer(true);
      
      // Get smart defaults for match sharing
      const smartDefaults = MatchContentTemplateService.getSmartDefaults(matchData);
      setMatchPrivacyLevel(smartDefaults.privacyLevel);
      form.setValue('privacy_level', transformPrivacyLevel(smartDefaults.postPrivacy));
      
      // Generate initial content if none exists
      if (!form.watch('content')) {
        const template = MatchContentTemplateService.generateContent(matchData, smartDefaults.privacyLevel);
        form.setValue('content', template.content);
        form.setValue('privacy_level', transformPrivacyLevel(template.privacyLevel));
      }
    }
  }, [matchData, form]);

  // Handle match privacy level changes
  const handleMatchPrivacyChange = (newLevel: MatchPrivacyLevel) => {
    setMatchPrivacyLevel(newLevel);
    
    if (matchData) {
      const template = MatchContentTemplateService.generateContent(matchData, newLevel);
      form.setValue('content', template.content);
      form.setValue('privacy_level', transformPrivacyLevel(template.privacyLevel));
    }
  };

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
      
      // Create mock post context for prompt generation with required properties
      const mockPost = {
        id: 'temp-id',
        content: form.watch('content') || '',
        user_id: user.id,
        created_at: new Date().toISOString(),
        author: {
          full_name: profile.full_name,
          user_type: profile.user_type,
          avatar_url: profile.avatar_url
        }
      } as Post;

      const context = ContextPromptEngine.buildContext(mockPost, user.id, profile.user_type);
      
      // Handle privacy level for prompt generation - only use valid types for prompt system
      const currentPrivacyLevel = form.watch('privacy_level');
      const validPrivacyLevel: "public" | "public_highlights" | "private" = 
        transformPrivacyLevel(currentPrivacyLevel || 'public');
      
      if (profile.user_type === 'coach') {
        const prompt = coachSystem.generateCoachPrompt(mockPost, context, profile.full_name);
        setCurrentPrompt(prompt.placeholder);
      } else {
        const prompt = promptEngine.generatePrompt(mockPost, context, profile.full_name);
        setCurrentPrompt(prompt.placeholder);
      }
    }
  }, [user, profile, form.watch('content'), form.watch('privacy_level')]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    form.setValue('privacy_level', transformPrivacyLevel(suggestion.privacyLevel));
    if (suggestion.template?.id) {
      form.setValue('template_id', suggestion.template.id);
    }
  };

  const handleQuickShare = async (content: string, privacyLevel: string, templateType: string) => {
    form.setValue('content', content);
    form.setValue('privacy_level', transformPrivacyLevel(privacyLevel));
    
    // Auto-submit if user preferences allow it
    if (sharingPreferences?.autoShare) {
      await handleSubmit(form.getValues());
    }
  };

  const handleCustomizationSave = () => {
    if (selectedSuggestion) {
      form.setValue('content', selectedSuggestion.content);
      form.setValue('privacy_level', transformPrivacyLevel(selectedSuggestion.privacyLevel));
      setShowCustomization(false);
      setSelectedSuggestion(null);
    }
  };

  const handleSuggestionCustomize = (suggestion: EnhancedPostSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowCustomization(true);
  };

  const handleSubmit = async (values: z.infer<typeof postSchema>) => {
    if (!user) {
      showErrorToast("Authentication required", "Please sign in to create posts.");
      return;
    }

    console.log('🚀 Submitting post with values:', values);
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

      console.log('💾 Inserting post data:', postData);

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

      // Transform the response to match our simplified privacy types
      const transformedPost: Post = {
        ...data,
        privacy_level: transformPrivacyLevel(data.privacy_level),
        author: data.profiles ? {
          full_name: data.profiles.full_name,
          user_type: data.profiles.user_type,
          avatar_url: data.profiles.avatar_url
        } : null,
        likes_count: 0,
        comments_count: 0
      };

      console.log('✅ Post created successfully:', transformedPost);
      showSuccessToast("Post created!", "Your post has been shared successfully.");
      
      form.reset();
      setMediaPreview(null);
      setMediaFile(null);
      setShowComposer(false);
      
      onSuccess?.(transformedPost);

    } catch (error) {
      console.error('❌ Error creating post:', error);
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
      case 'private':
        return 'Only people you follow can see this';
      default:
        return 'Select privacy level';
    }
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'public_highlights':
        return <Star className="h-4 w-4" />;
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'private':
        return <Users className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  // Check if form is valid for submission
  const isFormValid = form.watch('content')?.trim().length >= 3;

  console.log('🔍 PostComposer debug:', {
    content: form.watch('content'),
    contentLength: form.watch('content')?.trim().length,
    isFormValid,
    isSubmitting,
    matchData: !!matchData,
    matchPrivacyLevel
  });

  const { 
    suggestions: enhancedSuggestions, 
    isGenerating: isEnhancedGenerating, 
    generateMatchSuggestions,
    generateSessionSuggestions 
  } = useEnhancedAutoPostGeneration();

  // Generate enhanced suggestions when match data is available
  useEffect(() => {
    if (matchData && user) {
      generateMatchSuggestions(matchData);
    } else if (sessionData && user) {
      generateSessionSuggestions(sessionData);
    }
  }, [matchData, sessionData, user, generateMatchSuggestions, generateSessionSuggestions]);

  const handleEnhancedSuggestionSelect = (suggestion: EnhancedPostSuggestion) => {
    form.setValue('content', suggestion.content);
    form.setValue('privacy_level', transformPrivacyLevel(suggestion.privacyLevel));
    
    // If it's a match suggestion, also update the match privacy level
    if (matchData && suggestion.context === 'match') {
      setMatchPrivacyLevel(suggestion.matchPrivacyLevel);
    }
  };

  return (
    <Card className={`border border-gray-200 shadow-lg bg-white ${className}`}>
      
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-11 w-11 ring-2 ring-blue-200">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                {matchData ? 'Share Your Match' : 'Share Your Tennis Journey'}
              </h3>
              <p className="text-sm text-gray-600">
                {matchData 
                  ? 'Let the community know how it went!'
                  : profile?.user_type === 'coach' 
                    ? 'Share insights with your students' 
                    : 'Connect with the tennis community'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Ready
              </Badge>
            )}
            {matchData && (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                <Trophy className="h-3 w-3 mr-1" />
                Match Post
              </Badge>
            )}
            {/* Add preferences button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(!showPreferences)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {!matchData && (
              <Button 
                variant={showComposer ? "secondary" : "default"}
                size="sm" 
                onClick={() => setShowComposer(!showComposer)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {showComposer ? 'Minimize' : 'Create Post'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {(showComposer || matchData) && (
        <CardContent className="pt-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              
              {/* Quick Share Buttons - only show for match posts */}
              {matchData && sharingPreferences?.showQuickShareButtons !== false && (
                <QuickShareButtons
                  matchData={matchData}
                  onQuickShare={handleQuickShare}
                  disabled={isSubmitting}
                />
              )}

              {/* User Sharing Preferences */}
              <UserSharingPreferences
                isVisible={showPreferences}
                onClose={() => setShowPreferences(false)}
                onPreferencesChange={setSharingPreferences}
              />

              {/* Content Customization Panel */}
              {selectedSuggestion && (
                <ContentCustomizationPanel
                  suggestion={selectedSuggestion}
                  onContentUpdate={(content) => {
                    setSelectedSuggestion({ ...selectedSuggestion, content });
                  }}
                  onCancel={() => {
                    setShowCustomization(false);
                    setSelectedSuggestion(null);
                  }}
                  onSave={handleCustomizationSave}
                  isVisible={showCustomization}
                />
              )}

              {/* Match Privacy Selector - only show for match posts */}
              {matchData && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-5 border border-green-200">
                  <MatchPrivacySelector
                    value={matchPrivacyLevel}
                    onValueChange={handleMatchPrivacyChange}
                    matchOutcome={matchData.match_outcome}
                    followingCount={followingCount}
                  />
                </div>
              )}

              {/* Enhanced AI Suggestions Section with customization */}
              {matchData && enhancedSuggestions.length > 0 && !showCustomization && (
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-purple-900">Smart Match Suggestions</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          AI-Powered
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      {enhancedSuggestions.length} option{enhancedSuggestions.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {enhancedSuggestions.map((suggestion, index) => {
                      const IconComponent = privacyLevelIcons[suggestion.matchPrivacyLevel];
                      const colorClasses = privacyLevelColors[suggestion.matchPrivacyLevel];
                      const isRecommended = index === 0;
                      
                      return (
                        <Card 
                          key={suggestion.id}
                          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-purple-400"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${colorClasses.split(' ')[1]}`}>
                                <IconComponent className={`h-4 w-4 ${colorClasses.split(' ')[0]}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-900">
                                    {suggestion.template.title}
                                  </span>
                                  {isRecommended && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                      Recommended
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(suggestion.confidence * 100)}% match
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                                  {suggestion.content}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-xs ${colorClasses}`}>
                                      {suggestion.matchPrivacyLevel.charAt(0).toUpperCase() + suggestion.matchPrivacyLevel.slice(1)} Level
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      → {transformPrivacyLevel(suggestion.privacyLevel)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleSuggestionCustomize(suggestion)}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                    >
                                      <Edit3 className="h-3 w-3 mr-1" />
                                      Customize
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEnhancedSuggestionSelect(suggestion)}
                                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                                    >
                                      Use This
                                    </Button>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  {suggestion.reasoning}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Keep old suggestions for session data */}
              {!matchData && suggestions.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Brain className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-purple-900">AI Suggestions</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          Based on your {sessionData ? 'session' : 'activity'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <div 
                        key={suggestion.id}
                        className="bg-white rounded-lg p-4 border border-purple-100 cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all"
                        onClick={() => handleAiSuggestionSelect(suggestion)}
                      >
                        <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            {suggestion.template.category}
                          </Badge>
                          <span className="text-xs text-purple-600 font-medium">
                            {Math.round(suggestion.confidence * 100)}% match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                        className="min-h-[120px] resize-none border-2 border-gray-200 focus:border-blue-500 transition-colors text-base leading-relaxed rounded-lg"
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
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Label htmlFor="media" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <Camera className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-base font-medium text-gray-700">Add photo or video</span>
                      <p className="text-sm text-gray-500 mt-1">Share your tennis moments</p>
                    </div>
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

              {/* Only show regular privacy selector for non-match posts */}
              {!matchData && (
                <FormField
                  control={form.control}
                  name="privacy_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base font-medium">
                        <span>Who can see this post?</span>
                        {followingCount < 3 && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Growing your network
                          </Badge>
                        )}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 h-12">
                            <div className="flex items-center gap-2">
                              {getPrivacyIcon(field.value || 'public')}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public_highlights">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>🌟 Community Highlights</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-blue-500" />
                              <span>🌍 Public</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>🔒 Private</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-sm text-gray-600">
                        {getPrivacyDescription(field.value || 'public')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span>{matchData ? 'Match Enhanced' : 'AI Enhanced'}</span>
                  </div>
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <div className="animate-spin h-3 w-3 border border-purple-600 border-t-transparent rounded-full"></div>
                      <span>Generating suggestions...</span>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isFormValid}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {matchData ? 'Share Match' : 'Share Post'}
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
