
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface LikeButtonProps {
  postId: string;
  initialLikes?: number;
}

const LikeButton = ({ postId }: LikeButtonProps) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLikeData = async () => {
      if (!user) return;

      // Get like count
      const { data: likeCount } = await supabase
        .rpc('get_likes_count', { post_id: postId });

      // Check if user has liked
      const { data: hasLiked } = await supabase
        .rpc('has_liked', { 
          user_id: user.id,
          post_id: postId
        });

      setLikes(likeCount || 0);
      setIsLiked(hasLiked || false);
      setIsLoading(false);
    };

    fetchLikeData();
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ user_id: user.id, post_id: postId });

        if (error) throw error;
        setLikes(prev => prev - 1);
        setIsLiked(false);
        toast.success("Like removed");
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: postId });

        if (error) throw error;
        setLikes(prev => prev + 1);
        setIsLiked(true);
        toast.success("Post liked!");
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error("Failed to update like");
    }
  };

  if (isLoading) {
    return <Button variant="ghost" size="sm" disabled>Loading...</Button>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className="flex items-center gap-1"
    >
      <Heart
        className={`h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`}
      />
      {likes}
    </Button>
  );
};

export default LikeButton;
