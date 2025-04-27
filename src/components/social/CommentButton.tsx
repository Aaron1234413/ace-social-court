
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import CommentsModal from './CommentsModal';

interface CommentButtonProps {
  postId: string;
}

const CommentButton = ({ postId }: CommentButtonProps) => {
  const { user } = useAuth();
  const [commentCount, setCommentCount] = useState(0);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const fetchCommentCount = async () => {
    const { data, error } = await supabase
      .rpc('get_comments_count', { post_id: postId });

    if (error) {
      console.error('Error fetching comment count:', error);
      return;
    }

    setCommentCount(data || 0);
  };

  React.useEffect(() => {
    fetchCommentCount();
  }, [postId]);

  const handleCommentClick = () => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }
    setIsCommentsModalOpen(true);
  };

  const handleCommentSubmit = async (content: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        content,
        post_id: postId,
        user_id: user.id
      });

    if (error) {
      toast.error("Failed to submit comment");
      console.error(error);
      return;
    }

    toast.success("Comment submitted!");
    fetchCommentCount();
    setIsCommentsModalOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCommentClick}
        className="flex items-center gap-1"
      >
        <MessageSquare className="h-4 w-4" />
        {commentCount}
      </Button>

      <CommentsModal 
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        postId={postId}
        onSubmit={handleCommentSubmit}
      />
    </>
  );
};

export default CommentButton;
