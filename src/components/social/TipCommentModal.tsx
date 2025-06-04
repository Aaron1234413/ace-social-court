
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Info } from 'lucide-react';
import { toast } from 'sonner';

interface TipCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  isSubmitting: boolean;
}

export function TipCommentModal({ isOpen, onClose, onSubmit, isSubmitting }: TipCommentModalProps) {
  const [comment, setComment] = useState('');
  const minLength = 20;
  const isValid = comment.trim().length >= minLength;

  const handleSubmit = () => {
    if (!isValid) {
      toast.error(`Comment must be at least ${minLength} characters`);
      return;
    }
    onSubmit(comment.trim());
    setComment('');
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Share Your Coaching Tip
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Why we require a comment:</p>
              <p>Tips with coaching insights are more valuable to the community. Share your knowledge in 20+ characters.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Share one coaching insight... (e.g., 'Focus on keeping your elbow up during the follow-through')"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            <div className="flex justify-between items-center text-sm">
              <span className={`${isValid ? 'text-green-600' : 'text-red-500'}`}>
                {comment.length}/{minLength} characters minimum
              </span>
              {isValid && (
                <span className="text-green-600 font-medium">✓ Ready to share</span>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid || isSubmitting}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {isSubmitting ? 'Sharing Tip...' : 'Share Tip'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
