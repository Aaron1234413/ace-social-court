
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import MentionInput from './MentionInput';

interface CommentFormProps {
  postId: string;
  onCommentSubmit: (content: string) => void;
  isSubmitting: boolean;
  initialValue?: string;
  onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  postId, 
  onCommentSubmit, 
  isSubmitting,
  initialValue = '',
  onCancel
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState(initialValue);

  // Update comment text when initialValue changes
  useEffect(() => {
    setCommentText(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && !isSubmitting) {
      onCommentSubmit(commentText.trim());
      setCommentText('');
    }
  };

  const handleCancel = () => {
    setCommentText('');
    if (onCancel) {
      onCancel();
    }
  };

  if (!user) {
    return (
      <div className="text-center p-3 text-muted-foreground bg-accent/50 rounded-md">
        Sign in to add a comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <MentionInput
        value={commentText}
        onChange={setCommentText}
        onSubmit={() => {
          if (commentText.trim() && !isSubmitting) {
            onCommentSubmit(commentText.trim());
            setCommentText('');
          }
        }}
        placeholder="Add a comment..."
        autoFocus={!!initialValue}
        minRows={1}
        maxRows={4}
      />
      <div className="absolute right-2 bottom-2 flex gap-1">
        {initialValue && (
          <Button 
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button 
          type="submit" 
          size="icon" 
          className="h-8 w-8"
          disabled={!commentText.trim() || isSubmitting}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
