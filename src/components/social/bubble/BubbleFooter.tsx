
import React, { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import { ReactionBar } from '../ReactionBar';
import CommentButton from '../CommentButton';
import ShareButton from '../ShareButton';
import CommentForm from '../CommentForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast';

interface BubbleFooterProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
  selectedSuggestion?: string;
  onSuggestionUsed?: () => void;
}

export function BubbleFooter({ 
  post, 
  currentUserId, 
  contentType, 
  selectedSuggestion,
  onSuggestionUsed 
}: BubbleFooterProps) {
  const { user } = useAuth();
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Show comment form if there's a selected suggestion
  React.useEffect(() => {
    if (selectedSuggestion) {
      setShowCommentForm(true);
    }
  }, [selectedSuggestion]);

  const handleCommentSubmit = async (content: string) => {
    if (!user) {
      showErrorToast("Authentication required", "Please sign in to post comments.");
      return;
    }

    setIsSubmittingComment(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;

      showSuccessToast("Comment posted!", "Your comment has been added successfully.");

      // Clear the suggestion and hide form
      if (onSuggestionUsed) {
        onSuggestionUsed();
      }
      setShowCommentForm(false);

    } catch (error) {
      console.error('Error posting comment:', error);
      showErrorToast("Error posting comment", "Please try again later.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <CardContent className="pt-0 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <ReactionBar post={post} className="flex-1" />
        
        <div className="flex items-center gap-3 ml-4">
          <CommentButton 
            postId={post.id} 
            postUserId={post.user_id}
          />
          <ShareButton postId={post.id} />
        </div>
      </div>

      {/* Comment Form - Shows when suggestion is selected or manually opened */}
      {showCommentForm && (
        <div className="border-t pt-3">
          <CommentForm
            postId={post.id}
            onCommentSubmit={handleCommentSubmit}
            isSubmitting={isSubmittingComment}
            initialValue={selectedSuggestion}
          />
        </div>
      )}
    </CardContent>
  );
}
