
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
  const [isAnimating, setIsAnimating] = useState(false);

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
    
    // Set up realtime subscription for likes
    const channel = supabase
      .channel('public:likes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'likes',
          filter: `post_id=eq.${postId}`
        }, 
        () => {
          fetchLikeData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      setIsAnimating(true);
      
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ user_id: user.id, post_id: postId });

        if (error) throw error;
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: postId });

        if (error) throw error;
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
      
      // Reset animation state after a short delay
      setTimeout(() => setIsAnimating(false), 300);
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error("Failed to update like");
      setIsAnimating(false);
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
      className={`flex items-center gap-1 transition-all ${isAnimating ? 'scale-110' : ''}`}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${isLiked ? 'fill-current text-red-500' : ''} ${isAnimating && !isLiked ? 'animate-ping' : ''}`}
      />
      <span className={`${isLiked ? 'text-red-500 font-medium' : ''}`}>{likes}</span>
    </Button>
  );
};

export default LikeButton;
