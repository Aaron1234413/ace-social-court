
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit3, Sparkles, Share, PenTool, Info, Lightbulb } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PrivacySelector, PrivacyLevel } from './PrivacySelector';
import { AutoPostService } from '@/services/AutoPostService';
import { useUserFollows } from '@/hooks/useUserFollows';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PostComposerProps {
  onSuccess?: () => void;
  sessionData?: any;
}

export function PostComposer({ onSuccess, sessionData }: PostComposerProps) {
  const { user, profile } = useAuth();
  const { followingCount } = useUserFollows();
  
  const [mode, setMode] = useState<'write' | 'generate'>('write');
  const [isWriting, setIsWriting] = useState(false);
  const [content, setContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasUserSessions, setHasUserSessions] = useState(false);

  // Check if user has logged sessions for contextual guidance
  useEffect(() => {
    const checkUserSessions = async () => {
      if (!user) return;
      
      try {
        // Check for sessions in a way that won't cause type errors
        const { data, error } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_auto_generated', true)
          .limit(1);
        
        if (!error && data && data.length > 0) {
          setHasUserSessions(true);
        }
      } catch (error) {
        console.log('Could not check user sessions:', error);
        setHasUserSessions(false);
      }
    };
    
    checkUserSessions();
  }, [user]);

  // Smart privacy defaults for new users
  useEffect(() => {
    if (followingCount === 0) {
      setPrivacyLevel('public_highlights');
    } else if (followingCount < 3) {
      setPrivacyLevel('friends');
    } else {
      setPrivacyLevel('private');
    }
  }, [followingCount]);

  // Auto-generate content when sessionData is provided
  useEffect(() => {
    if (sessionData && user && mode === 'generate') {
      generateContent();
    }
  }, [sessionData, user, mode]);

  const generateContent = async () => {
    if (!user || !sessionData) return;
    
    setIsGenerating(true);
    try {
      const autoPostService = AutoPostService.getInstance();
      const suggestions = await autoPostService.generatePostSuggestions(sessionData, user.id);
      
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        setGeneratedContent(suggestion.content);
        setContent(suggestion.content);
        setPrivacyLevel(suggestion.privacyLevel as PrivacyLevel);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickShare = async () => {
    if (!user || !content.trim()) {
      toast.error('Please enter some content for your post');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          privacy_level: privacyLevel,
          is_auto_generated: mode === 'generate' && content === generatedContent,
        });

      if (error) throw error;

      toast.success('Post shared successfully!');
      setContent('');
      setGeneratedContent('');
      setMode('write');
      setIsWriting(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to share post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartWriting = () => {
    setMode('write');
    setIsWriting(true);
  };

  const handleStartGenerating = () => {
    setMode('generate');
    if (sessionData) {
      generateContent();
    }
  };

  const getContextualGuidance = () => {
    if (!hasUserSessions && followingCount === 0) {
      return {
        type: 'new-user',
        title: 'New to Rally?',
        message: 'Start by sharing what brings you to tennis, your goals, or a recent playing experience.',
        action: sessionData ? null : 'Try logging a session first to get AI-generated post ideas!'
      };
    }
    
    if (hasUserSessions && !sessionData && mode === 'write') {
      return {
        type: 'session-hint',
        title: 'Pro tip',
        message: 'You can generate posts from your training sessions for richer content.',
        action: null
      };
    }
    
    if (followingCount >= 3 && privacyLevel === 'private') {
      return {
        type: 'network-growth',
        title: 'Growing network',
        message: 'Consider sharing publicly to connect with more players.',
        action: null
      };
    }
    
    return null;
  };

  const guidance = getContextualGuidance();
  const shouldShowAutoPublishWarning = followingCount === 0 && privacyLevel === 'public_highlights';

  return (
    <TooltipProvider>
      <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
        <CardContent className="p-6 space-y-6">
          {/* Enhanced Header with user info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {profile?.full_name || profile?.username || 'You'}
              </h3>
              <p className="text-sm text-muted-foreground">Share your tennis journey</p>
            </div>

            {/* Contextual guidance tooltip */}
            {guidance && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-xs">{guidance.title}</p>
                    <p className="text-xs">{guidance.message}</p>
                    {guidance.action && (
                      <p className="text-xs text-primary">{guidance.action}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Main Content Area */}
          {!isWriting && mode === 'write' ? (
            // Enhanced empty state with clear visual hierarchy
            <div className="space-y-6">
              <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-colors">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4">
                      <PenTool className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Share what's on your mind</h3>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Write about your tennis journey, share tips, or connect with the community
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
                    <Button
                      onClick={handleStartWriting}
                      className="flex items-center gap-3 h-12 px-6 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                      size="lg"
                    >
                      <PenTool className="h-5 w-5" />
                      Write a Post
                    </Button>
                    
                    {sessionData ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleStartGenerating}
                            variant="outline"
                            className="flex items-center gap-3 h-12 px-6 text-base font-medium border-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                            size="lg"
                          >
                            <Sparkles className="h-5 w-5 text-primary" />
                            Generate from Session
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Create a post based on your recent training session</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => window.location.href = '/log-session'}
                            variant="outline"
                            className="flex items-center gap-3 h-12 px-6 text-base font-medium border-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                            size="lg"
                          >
                            <Sparkles className="h-5 w-5 text-primary" />
                            Log Session First
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Log a training session to generate AI-powered post content</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Enhanced active posting interface
            <div className="space-y-6">
              {/* Mode indicator with improved styling */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {mode === 'generate' && (
                    <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                      <Sparkles className="h-4 w-4" />
                      AI Generated Content
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsWriting(false);
                    setContent('');
                    setMode('write');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>

              {/* Enhanced content area */}
              {mode === 'generate' ? (
                <div className="space-y-4">
                  {isGenerating ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <div className="text-center space-y-3">
                        <Sparkles className="h-8 w-8 animate-pulse mx-auto text-primary" />
                        <p className="font-medium">Generating personalized content...</p>
                        <p className="text-sm">This may take a moment</p>
                      </div>
                    </div>
                  ) : content ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
                        <p className="text-base leading-relaxed">{content}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setMode('write');
                          setIsWriting(true);
                        }}
                        className="w-full h-12 border-2 hover:bg-primary/5 hover:border-primary/30"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Content
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="space-y-3">
                        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <Sparkles className="h-8 w-8" />
                        </div>
                        <p className="font-medium">No session data available</p>
                        <p className="text-sm">Log a training session to generate content</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Enhanced manual writing mode
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder="What's happening in your tennis world? Share your thoughts, progress, or ask for advice..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[140px] resize-none border-2 border-muted focus:border-primary text-base leading-relaxed p-4 rounded-xl"
                      maxLength={500}
                      autoFocus
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                      {content.length}/500
                    </div>
                  </div>
                </div>
              )}

              {/* Progressive Privacy selector - only show when there's content */}
              {content.trim() && (
                <div className="space-y-4">
                  {/* Auto-publish warning with enhanced styling */}
                  {shouldShowAutoPublishWarning && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 text-blue-700 cursor-help">
                            <Info className="h-4 w-4" />
                            <span className="text-sm font-medium">Public highlights selected</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Since you have no connections yet, we're posting as public highlights to help you connect with the community.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <PrivacySelector 
                      value={privacyLevel} 
                      onValueChange={setPrivacyLevel}
                      followingCount={followingCount}
                      showPreview={true}
                      content={content}
                      userProfile={profile}
                    />
                  </div>
                </div>
              )}

              {/* Enhanced action buttons */}
              {content.trim() && (
                <div className="flex items-center justify-end pt-4 border-t">
                  <Button
                    onClick={handleQuickShare}
                    disabled={!content.trim() || isSubmitting}
                    className="px-8 h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share className="h-4 w-4 mr-2" />
                        Share Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
