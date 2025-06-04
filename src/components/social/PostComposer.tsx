
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit3, Sparkles, Share, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PrivacySelector, PrivacyLevel } from './PrivacySelector';
import { AutoPostService } from '@/services/AutoPostService';
import { useUserFollows } from '@/hooks/useUserFollows';

interface PostComposerProps {
  onSuccess?: () => void;
  sessionData?: any; // From session logging
}

export function PostComposer({ onSuccess, sessionData }: PostComposerProps) {
  const { user, profile } = useAuth();
  const { followingCount } = useUserFollows();
  
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
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {profile?.full_name || profile?.username || 'You'}
              </span>
              {mode === 'auto' && generatedContent && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  AI Generated
                </div>
              )}
            </div>
          </div>

          {/* Mode toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            className="text-muted-foreground"
          >
            {mode === 'auto' ? (
              <>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Auto
              </>
            )}
          </Button>
        </div>

        {/* Auto-publish warning for new users */}
        {shouldShowAutoPublishWarning && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              Since you have no friends/coach yet, posting as public highlights to help you connect with the community.
            </AlertDescription>
          </Alert>
        )}

        {/* Content area */}
        {mode === 'auto' ? (
          // Auto mode - show generated content with quick share
          <div className="space-y-3">
            {isGenerating ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse mr-2" />
                Generating content...
              </div>
            ) : content ? (
              <div className="bg-muted/30 rounded-lg p-4 border border-dashed">
                <p className="text-sm leading-relaxed">{content}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No content generated yet</p>
                <p className="text-xs">Complete a session to generate a post</p>
              </div>
            )}
          </div>
        ) : (
          // Edit mode - full composer
          <div className="space-y-3">
            <Textarea
              placeholder="What's happening in your tennis world?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none border-0 p-0 focus-visible:ring-0 text-base"
              maxLength={500}
            />
            
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/500 characters
            </div>
          </div>
        )}

        {/* Privacy selector - always prominent */}
        <div className="border-t pt-4">
          <PrivacySelector 
            value={privacyLevel} 
            onValueChange={setPrivacyLevel}
            followingCount={followingCount}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            {mode === 'auto' && generatedContent && (
              <span>AI-generated content • Tap edit to customize</span>
            )}
          </div>

          <div className="flex gap-2">
            {mode === 'edit' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setContent('');
                  setMode('auto');
                }}
              >
                Cancel
              </Button>
            )}
            
            <Button
              onClick={handleQuickShare}
              disabled={!content.trim() || isSubmitting}
              className="px-6"
              size="sm"
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
        </div>
      </CardContent>
    </Card>
  );
}
