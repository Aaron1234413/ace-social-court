
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import CommentsModal from './CommentsModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommentButtonProps {
  postId: string;
  postUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const CommentButton = ({ 
  postId, 
  postUserId, 
  variant = "ghost", 
  size = "sm" 
}: CommentButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: commentsCount = 0, isLoading } = useQuery({
    queryKey: ['comments-count', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_comments_count', { post_id: postId });
        
      if (error) throw error;
      return data || 0;
    }
  });

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        disabled={isLoading}
        aria-label="View comments"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="tabular-nums">{commentsCount}</span>
        <span className="sr-only md:not-sr-only md:ml-1">
          {commentsCount === 1 ? 'Comment' : 'Comments'}
        </span>
      </Button>
      
      <CommentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={postId}
        postUserId={postUserId}
      />
    </>
  );
};

export default CommentButton;
