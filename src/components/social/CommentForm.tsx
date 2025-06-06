
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CommentFormProps {
  postId: string;
  onCommentSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
  initialValue?: string;
  placeholder?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  onCommentSubmit,
  isSubmitting,
  initialValue = '',
  placeholder = "Add a comment..."
}) => {
  const [comment, setComment] = useState(initialValue);

  useEffect(() => {
    setComment(initialValue);
  }, [initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && !isSubmitting) {
      await onCommentSubmit(comment);
      setComment('');
    }
  };

  const commentFieldId = `comment-${postId}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={commentFieldId} className="sr-only">
          Add a comment
        </Label>
        <Textarea
          id={commentFieldId}
          name={`comment-${postId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={!comment.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
