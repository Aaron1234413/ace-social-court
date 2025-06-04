
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit3, Sparkles, Share, AlertCircle, PenTool, Info, Lightbulb } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PrivacySelector, PrivacyLevel } from './PrivacySelector';
import { AutoPostService } from '@/services/AutoPostService';
import { useUserFollows } from '@/hooks/useUserFollows';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PostComposerProps {
  onSuccess?: () => void;
  sessionData?: any; // From session logging
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
      
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setHasUserSessions(true);
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
      <Card className="w-full">
        <CardContent className="p-4 space-y-4">
          {/* Header with user info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <span className="font-medium">
                {profile?.full_name || profile?.username || 'You'}
              </span>
            </div>

            {/* Contextual guidance tooltip */}
            {guidance && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-xs">{guidance.title}</p>
                    <p className="text-xs">{guidance.message}</p>
                    {guidance.action && (
                      <p className="text-xs text-blue-600">{guidance.action}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Main Content Area */}
          {!isWriting && mode === 'write' ? (
            // Empty state with action options
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Share what's on your mind</h3>
                    <p className="text-sm text-muted-foreground">
                      Write about your tennis journey, share tips, or connect with the community
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={handleStartWriting}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <PenTool className="h-4 w-4" />
                      Write a Post
                    </Button>
                    
                    {sessionData ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleStartGenerating}
                            variant="outline"
                            className="flex items-center gap-2"
                            size="lg"
                          >
                            <Sparkles className="h-4 w-4" />
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
                            className="flex items-center gap-2"
                            size="lg"
                          >
                            <Sparkles className="h-4 w-4" />
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
            // Active posting interface
            <div className="space-y-4">
              {/* Mode indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mode === 'generate' && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                      <Sparkles className="h-3 w-3" />
                      AI Generated
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
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>

              {/* Content area */}
              {mode === 'generate' ? (
                <div className="space-y-3">
                  {isGenerating ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-pulse mr-2" />
                      Generating content...
                    </div>
                  ) : content ? (
                    <div className="space-y-3">
                      <div className="bg-muted/30 rounded-lg p-4 border border-dashed">
                        <p className="text-sm leading-relaxed">{content}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMode('write');
                          setIsWriting(true);
                        }}
                        className="w-full"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Content
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No session data available to generate content</p>
                    </div>
                  )}
                </div>
              ) : (
                // Manual writing mode
                <div className="space-y-3">
                  <Textarea
                    placeholder="What's happening in your tennis world?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] resize-none border-0 p-0 focus-visible:ring-0 text-base"
                    maxLength={500}
                    autoFocus
                  />
                  
                  <div className="text-xs text-muted-foreground text-right">
                    {content.length}/500 characters
                  </div>
                </div>
              )}

              {/* Progressive Privacy selector - only show when there's content */}
              {content.trim() && (
                <>
                  {/* Auto-publish warning with tooltip instead of prominent alert */}
                  {shouldShowAutoPublishWarning && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-blue-600 cursor-help">
                            <Info className="h-4 w-4" />
                            <span className="text-xs">Public highlights selected</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
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
                </>
              )}

              {/* Action buttons */}
              {content.trim() && (
                <div className="flex items-center justify-end pt-2">
                  <Button
                    onClick={handleQuickShare}
                    disabled={!content.trim() || isSubmitting}
                    className="px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share className="h-3 w-3 mr-2" />
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
