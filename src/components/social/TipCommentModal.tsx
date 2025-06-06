
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TipCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  isSubmitting: boolean;
}

export function TipCommentModal({ isOpen, onClose, onSubmit, isSubmitting }: TipCommentModalProps) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment.trim());
      setComment('');
    }
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Coaching Tip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tip-comment">Your tip or insight:</Label>
            <Textarea
              id="tip-comment"
              name="tip-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share a coaching insight, technique tip, or encouragement..."
              className="min-h-[100px]"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? 'Sharing...' : 'Share Tip'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
