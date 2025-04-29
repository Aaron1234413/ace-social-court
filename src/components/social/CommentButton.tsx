
import React, { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchCommentCount = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_comments_count', { post_id: postId });

      if (error) {
        console.error('Error fetching comment count:', error);
        return;
      }

      setCommentCount(data || 0);
    } catch (error) {
      console.error('Error in comment count fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommentCount();
    
    // Set up realtime subscription for comments
    const channel = supabase
      .channel('public:comments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${postId}`
        }, 
        () => {
          fetchCommentCount();
          if (!isCommentsModalOpen) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 1000);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, isCommentsModalOpen]);

  const handleCommentClick = () => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }
    setIsCommentsModalOpen(true);
  };

  const handleCommentSubmit = async (content: string) => {
    if (!user || !content.trim()) return;

    try {
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

      toast.success("Comment added");
      fetchCommentCount();
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCommentClick}
        className={`flex items-center gap-1 text-muted-foreground hover:text-foreground transition-all ${isAnimating ? 'animate-pulse' : ''}`}
      >
        <MessageSquare className="h-4 w-4" />
        <span
          className={`${isAnimating ? 'font-medium' : ''}`}
        >
          {isLoading ? "..." : commentCount}
        </span>
        <span className="sr-only md:not-sr-only md:ml-1">Comments</span>
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
