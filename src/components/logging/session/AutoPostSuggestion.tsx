
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PostSuggestion } from '@/services/AutoPostService';
import { PrivacySelector, PrivacyLevel } from '@/components/social/PrivacySelector';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, ThumbsUp, ThumbsDown, Edit3, Send } from 'lucide-react';

interface AutoPostSuggestionProps {
  suggestion: PostSuggestion;
  onAccept?: () => void;
  onDecline?: () => void;
  onEdit?: (content: string, privacyLevel: PrivacyLevel) => void;
}

export function AutoPostSuggestion({
  suggestion,
  onAccept,
  onDecline,
  onEdit
}: AutoPostSuggestionProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(suggestion.content);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(suggestion.privacyLevel);
  const [isPosting, setIsPosting] = useState(false);

  const handleAccept = async () => {
    if (!user) return;
    
    try {
      setIsPosting(true);
      
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: editedContent,
          privacy_level: privacyLevel,
          template_id: suggestion.template.id,
          is_auto_generated: true,
          engagement_score: Math.floor(suggestion.confidence * 10)
        });

      if (error) throw error;
      
      toast.success('Post created successfully!');
      onAccept?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      onEdit?.(editedContent, privacyLevel);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const confidenceColor = suggestion.confidence >= 0.8 
    ? 'bg-green-100 text-green-800' 
    : suggestion.confidence >= 0.6 
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-gray-100 text-gray-800';

  return (
    <Card className="border-dashed border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Suggested Post
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={confidenceColor}>
              {Math.round(suggestion.confidence * 100)}% match
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {suggestion.template.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px]"
              placeholder="Edit your post content..."
            />
            
            <PrivacySelector
              value={privacyLevel}
              onValueChange={setPrivacyLevel}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-sm leading-relaxed">{editedContent}</p>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Privacy: <span className="font-medium capitalize">{privacyLevel}</span>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-white/70 p-2 rounded">
          <strong>Template:</strong> {suggestion.template.title}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleAccept}
            disabled={isPosting}
            className="flex-1"
            size="sm"
          >
            <Send className="h-4 w-4 mr-1" />
            {isPosting ? 'Posting...' : 'Post It'}
          </Button>
          
          <Button
            onClick={handleEdit}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            {isEditing ? 'Save' : 'Edit'}
          </Button>
          
          <Button
            onClick={onDecline}
            variant="ghost"
            size="sm"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
