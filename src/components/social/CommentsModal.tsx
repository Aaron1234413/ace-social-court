
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

const CommentsModal = ({ isOpen, onClose, postId, onSubmit }: CommentsModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }

      // Then fetch profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', comment.user_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile for comment:', profileError);
            return {
              ...comment,
              user_name: 'Anonymous'
            };
          }

          return {
            ...comment,
            user_name: profileData.full_name || 'Anonymous'
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error in comment fetching process:', error);
    } finally {
      setIsLoading(false);
    }
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
        
        <div className="max-h-[400px] overflow-y-auto space-y-4 pt-2">
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">
              Loading comments...
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="border-b pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {comment.user_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {comment.user_name || 'Anonymous'}
                      </p>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full resize-none"
            rows={2}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!newComment.trim() || !user}
            className="w-full"
          >
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;
