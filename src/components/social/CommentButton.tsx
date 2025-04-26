
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CommentButtonProps {
  postId: string;
}

const CommentButton = ({ postId }: CommentButtonProps) => {
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommentCount = async () => {
      const { data, error } = await supabase
        .rpc('get_comments_count', { post_id: postId });

      if (error) {
        console.error('Error fetching comment count:', error);
        return;
      }

      setCommentCount(data || 0);
      setIsLoading(false);
    };

    fetchCommentCount();
  }, [postId]);

  const handleComment = () => {
    toast.info("Comments feature coming soon!");
  };

  if (isLoading) {
    return <Button variant="ghost" size="sm" disabled>Loading...</Button>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleComment}
      className="flex items-center gap-1"
    >
      <MessageSquare className="h-4 w-4" />
      {commentCount}
    </Button>
  );
};

export default CommentButton;
