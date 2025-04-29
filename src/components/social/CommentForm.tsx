
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import MentionInput from './MentionInput';

interface CommentFormProps {
  postId: string;
  onCommentSubmit: (content: string) => void;
  isSubmitting: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  postId, 
  onCommentSubmit, 
  isSubmitting 
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && !isSubmitting) {
      onCommentSubmit(commentText.trim());
      setCommentText('');
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
        autoFocus={true}
        minRows={1}
        maxRows={4}
      />
      <Button 
        type="submit" 
        size="icon" 
        className="absolute right-2 bottom-2"
        disabled={!commentText.trim() || isSubmitting}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default CommentForm;
