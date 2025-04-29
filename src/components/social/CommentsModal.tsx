
import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/AuthProvider';
import CommentsDisplay from './CommentsDisplay';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onSubmit: (content: string) => void;
}

const CommentsModal = ({ isOpen, onClose, postId, onSubmit }: CommentsModalProps) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    try {
      setIsSubmitting(true);
      await onSubmit(comment);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <CommentsDisplay postId={postId} />
          
          {user && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!comment.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Post comment'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;
