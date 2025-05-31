
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNotifications } from "@/components/notifications/useNotifications";
import LikesModal from "./LikesModal";

interface LikeButtonProps {
  postId: string;
  postUserId: string;
  postContent?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const LikeButton = ({ 
  postId, 
  postUserId, 
  postContent,
  variant = "ghost",
  size = "sm"
}: LikeButtonProps) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const { createNotification } = useNotifications();

  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        setIsLoading(true);
        
        // Get like count regardless of authentication status
        const { data: countData, error: countError } = await supabase
          .rpc('get_likes_count', { post_id: postId });
          
        if (countError) throw countError;
        setLikeCount(countData || 0);
        
        // Check if current user has liked the post (if logged in)
        if (user) {
          const { data: hasLikedData, error: hasLikedError } = await supabase
            .rpc('has_liked', { user_id: user.id, post_id: postId });
            
          if (hasLikedError) throw hasLikedError;
          setHasLiked(hasLikedData || false);
        }
      } catch (error) {
        console.error('Error fetching like data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikeData();
    
    // Set up subscription for likes
    const channel = supabase
      .channel('public:likes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'likes',
          filter: `post_id=eq.${postId}`
        }, 
        async () => {
          try {
            const { data, error } = await supabase.rpc('get_likes_count', { post_id: postId });
            if (error) throw error;
            setLikeCount(data || 0);
          } catch (err) {
            console.error('Error updating like count:', err);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like posts", {
        description: "Create an account or login to interact with posts",
        icon: <Heart className="h-4 w-4" />
      });
      return;
    }
    
    // Optimistic UI update
    setIsLoading(true);
    const wasLiked = hasLiked;
    const prevCount = likeCount;
    
    setHasLiked(!wasLiked);
    setLikeCount(wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    
    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
          
        if (error) throw error;
        
        // Only send notification if the like is for someone else's post
        if (user.id !== postUserId) {
          // Create notification for the post owner
          const contentPreview = postContent ? 
            (postContent.length > 30 ? postContent.substring(0, 30) + '...' : postContent) : 
            'your post';
            
          try {
            await createNotification({
              userIds: [postUserId],
              type: 'like',
              content: `Someone liked your post: "${contentPreview}"`,
              senderId: user.id,
              entityId: postId,
              entityType: 'post'
            });
          } catch (notifError) {
            console.error('Error sending notification:', notifError);
            // Don't rethrow, as like operation still succeeded
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert the optimistic update
      setHasLiked(wasLiked);
      setLikeCount(prevCount);
      
      toast.error("Failed to update like status", {
        description: "Please try again later"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowLikes = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeCount > 0) {
      setShowLikesModal(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center gap-1 transition-all duration-200 ${
          hasLiked 
            ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label={hasLiked ? "Unlike post" : "Like post"}
      >
        <Heart 
          className={`h-4 w-4 transition-all ${hasLiked ? 'fill-current scale-110' : 'scale-100'}`} 
        />
        <button
          onClick={handleShowLikes}
          className={`tabular-nums hover:underline ${likeCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
          disabled={likeCount === 0}
        >
          {likeCount}
        </button>
        <span className="sr-only md:not-sr-only md:ml-1">
          {likeCount === 1 ? 'Like' : 'Likes'}
        </span>
      </Button>

      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={postId}
      />
    </>
  );
};

export default LikeButton;
