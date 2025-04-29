
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNotifications } from "@/components/notifications/useNotifications";

interface LikeButtonProps {
  postId: string;
  postUserId: string;
  postContent?: string;
}

const LikeButton = ({ postId, postUserId, postContent }: LikeButtonProps) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { createNotification } = useNotifications();

  useEffect(() => {
    const fetchLikeData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const [likesResponse, hasLikedResponse] = await Promise.all([
          supabase.rpc('get_likes_count', { post_id: postId }),
          supabase.rpc('has_liked', { user_id: user.id, post_id: postId })
        ]);

        if (likesResponse.error) throw likesResponse.error;
        if (hasLikedResponse.error) throw hasLikedResponse.error;

        setLikeCount(likesResponse.data || 0);
        setHasLiked(hasLikedResponse.data || false);
      } catch (error) {
        console.error('Error fetching like data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikeData();
    
    // Set up subscription for likes
    if (user) {
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
            supabase.rpc('get_likes_count', { post_id: postId })
              .then(({ data }) => setLikeCount(data || 0));
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }
    
    try {
      if (hasLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });
          
        if (error) throw error;
        
        setHasLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
          
        if (error) throw error;
        
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Only send notification if the like is for someone else's post
        if (user.id !== postUserId) {
          // Create notification for the post owner
          const contentPreview = postContent ? 
            (postContent.length > 30 ? postContent.substring(0, 30) + '...' : postContent) : 
            'your post';
            
          await createNotification({
            userIds: [postUserId],
            type: 'like',
            content: `Someone liked your post: "${contentPreview}"`,
            senderId: user.id,
            entityId: postId,
            entityType: 'post'
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like status");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className={`flex items-center gap-1 ${
        hasLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'
      }`}
      disabled={isLoading}
    >
      <Heart 
        className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} 
      />
      <span>{likeCount}</span>
      <span className="sr-only md:not-sr-only md:ml-1">Likes</span>
    </Button>
  );
};

export default LikeButton;
