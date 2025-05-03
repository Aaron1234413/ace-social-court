
import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast';
import CommentsDisplay from './CommentsDisplay';
import { useNotifications } from '@/components/notifications/useNotifications';
import CommentForm from './CommentForm';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postUserId: string;
}

const CommentsModal = ({ isOpen, onClose, postId, postUserId }: CommentsModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  const handleCommentSubmit = async (content: string) => {
    if (!content.trim() || !user) return;

    try {
      setIsSubmitting(true);
      
      const { error, data } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        })
        .select('*')
        .single();

      if (error) throw error;
      
      showSuccessToast('Comment added');
      
      // Notify post owner if it's not the user's own post
      if (user.id !== postUserId) {
        const contentPreview = content.length > 30 ? content.substring(0, 30) + '...' : content;
        await createNotification({
          userIds: [postUserId],
          type: 'comment',
          content: `Someone commented on your post: "${contentPreview}"`,
          senderId: user.id,
          entityId: postId,
          entityType: 'post'
        });
      }
      
    } catch (error) {
      console.error('Error posting comment:', error);
      showErrorToast('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1">
            <CommentsDisplay postId={postId} />
          </div>
          
          <div className="pt-2 border-t sticky bottom-0 bg-background">
            <CommentForm 
              postId={postId} 
              onCommentSubmit={handleCommentSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;
