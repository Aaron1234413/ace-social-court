
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNotifications } from "@/components/notifications/useNotifications";

interface FollowButtonProps {
  userId: string;
  username?: string;
  fullName?: string;
  isFollowing?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const FollowButton = ({ 
  userId, 
  username, 
  fullName, 
  isFollowing: initialIsFollowing,
  variant = "ghost",
  size = "sm"
}: FollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
  const [isLoading, setIsLoading] = useState(true);
  const { createNotification } = useNotifications();

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .rpc('is_following', {
            follower_id: user.id,
            following_id: userId
          });
        
        if (error) {
          console.error('Error checking follow status:', error);
          return;
        }
        
        setIsFollowing(data || false);
      } catch (err) {
        console.error('Failed to check follow status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [userId, user]);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users", {
        description: "Create an account or login to connect with others",
        icon: <UserPlus className="h-4 w-4" />
      });
      return;
    }

    // Optimistic UI update
    setIsLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .match({ follower_id: user.id, following_id: userId });

        if (error) throw error;
        
        toast.success("User unfollowed", {
          description: "You'll no longer see their posts in your feed",
          icon: <UserCheck className="h-4 w-4" />
        });
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({ follower_id: user.id, following_id: userId });

        if (error) throw error;
        
        toast.success("User followed!", {
          description: "You'll see their posts in your feed",
          icon: <UserPlus className="h-4 w-4" />
        });
        
        // Create notification for new follower
        const displayName = fullName || username || 'Someone';
        await createNotification({
          userIds: [userId],
          type: 'follow',
          content: `${displayName} started following you`,
          senderId: user.id,
          entityId: null,
          entityType: null
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      // Revert optimistic update
      setIsFollowing(wasFollowing);
      toast.error("Failed to update follow status", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show the button at all if it's the user's own profile
  if (userId === user?.id) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollow}
      className={`flex items-center gap-1 transition-all duration-200 ${
        isFollowing ? 'bg-primary/10 hover:bg-primary/20' : ''
      }`}
      disabled={isLoading}
    >
      {isFollowing ? (
        <UserCheck className="h-4 w-4 text-green-500" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;
