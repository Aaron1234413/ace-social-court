
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit3, Sparkles, Share, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PrivacySelector, PrivacyLevel } from './PrivacySelector';
import { AutoPostService } from '@/services/AutoPostService';
import { useUserFollows } from '@/hooks/useUserFollows';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PostComposerProps {
  onSuccess?: () => void;
  sessionData?: any;
}

export function PostComposer({ onSuccess, sessionData }: PostComposerProps) {
  const { user, profile } = useAuth();
  const { followingCount } = useUserFollows();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<'auto' | 'edit'>('auto');
  const [content, setContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (sessionData && user) {
      generateContent();
      setIsExpanded(true);
    }
  }, [sessionData, user]);

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
          is_auto_generated: mode === 'auto' && content === generatedContent,
        });

      if (error) throw error;

      toast.success('Post shared successfully!');
      setContent('');
      setGeneratedContent('');
      setMode('auto');
      setIsExpanded(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to share post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    if (mode === 'auto') {
      setMode('edit');
    } else {
      setMode('auto');
      if (generatedContent) {
        setContent(generatedContent);
      }
    }
  };

  const shouldShowAutoPublishWarning = followingCount === 0 && privacyLevel === 'public_highlights';

  return (
    <Card className="w-full">
      <CardContent className="p-3">
        {/* Compact header - always visible */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">
                    {isExpanded ? 'Share an update...' : 'What\'s happening in your tennis world?'}
                  </span>
                  {mode === 'auto' && generatedContent && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      AI Generated
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {mode === 'auto' && generatedContent && !isExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMode();
                    }}
                    className="text-xs h-7 px-2"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 mt-3">
            {/* Auto-publish warning for new users */}
            {shouldShowAutoPublishWarning && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  Since you have no friends/coach yet, posting as public highlights to help you connect with the community.
                </AlertDescription>
              </Alert>
            )}

            {/* Content area */}
            {mode === 'auto' ? (
              <div className="space-y-3">
                {isGenerating ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse mr-2" />
                    <span className="text-sm">Generating content...</span>
                  </div>
                ) : content ? (
                  <div className="bg-muted/30 rounded-lg p-3 border border-dashed">
                    <p className="text-sm leading-relaxed">{content}</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No content generated yet</p>
                    <p className="text-xs">Complete a session to generate a post</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="What's happening in your tennis world?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-none border-0 p-0 focus-visible:ring-0 text-sm"
                  maxLength={500}
                />
                
                <div className="text-xs text-muted-foreground text-right">
                  {content.length}/500 characters
                </div>
              </div>
            )}

            {/* Privacy selector - compact version */}
            <div className="border-t pt-3">
              <PrivacySelector 
                value={privacyLevel} 
                onValueChange={setPrivacyLevel}
                followingCount={followingCount}
                showPreview={false}
                content={content || "Sample post content for preview..."}
                userProfile={profile}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                {mode === 'auto' && generatedContent && (
                  <span>AI-generated • Tap edit to customize</span>
                )}
              </div>

              <div className="flex gap-2">
                {mode === 'edit' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMode}
                    className="text-xs h-8"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto
                  </Button>
                )}

                <Button
                  onClick={handleQuickShare}
                  disabled={!content.trim() || isSubmitting}
                  size="sm"
                  className="h-8 px-4"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-3 w-3 mr-1 border border-white border-t-transparent rounded-full" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share className="h-3 w-3 mr-1" />
                      Share
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
