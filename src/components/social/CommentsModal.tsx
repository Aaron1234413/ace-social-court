
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onSubmit: (content: string) => void;
}

const CommentsModal = ({ isOpen, onClose, postId, onSubmit }: CommentsModalProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(full_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    setComments(data || []);
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    await onSubmit(newComment);
    setNewComment('');
    fetchComments();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[300px] overflow-y-auto space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-2">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">
                  {comment.profiles?.full_name || 'Anonymous'}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full"
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!newComment.trim()}
            className="w-full"
          >
            Post Comment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;
