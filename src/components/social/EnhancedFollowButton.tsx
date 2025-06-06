
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNotifications } from "@/components/notifications/useNotifications";
import { AIUserSocialService } from "@/services/AIUserSocialService";

interface EnhancedFollowButtonProps {
  userId: string;
  username?: string;
  fullName?: string;
  isAIUser?: boolean;
  isFollowing?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const EnhancedFollowButton = ({ 
  userId, 
  username, 
  fullName, 
  isAIUser = false,
  isFollowing: initialIsFollowing,
  variant = "ghost",
  size = "sm"
}: EnhancedFollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
  const [isLoading, setIsLoading] = useState(true);
  const { createNotification } = useNotifications();
  const aiSocialService = AIUserSocialService.getInstance();

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
        
        toast.success(
          isAIUser ? "AI coach unfollowed" : "User unfollowed", 
          {
            description: isAIUser ? 
              "You'll no longer see their tips and content" : 
              "You'll no longer see their posts in your feed",
            icon: <UserCheck className="h-4 w-4" />
          }
        );
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({ follower_id: user.id, following_id: userId });

        if (error) throw error;
        
        const displayName = fullName || username || 'Someone';
        
        toast.success(
          isAIUser ? "AI coach followed!" : "User followed!", 
          {
            description: isAIUser ? 
              "You'll see their expert tips and content in your feed" : 
              "You'll see their posts in your feed",
            icon: isAIUser ? <Bot className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />
          }
        );
        
        // Create notification for new follower (only for real users)
        if (!isAIUser) {
          await createNotification({
            userIds: [userId],
            type: 'follow',
            content: `${displayName} started following you`,
            senderId: user.id,
            entityId: null,
            entityType: null
          });
        } else {
          // Trigger AI user follow back logic
          setTimeout(async () => {
            await aiSocialService.handleAutomaticFollowBack(user.id, userId);
          }, Math.random() * 10000 + 5000); // 5-15 seconds delay
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      setIsFollowing(wasFollowing);
      toast.error("Failed to update follow status", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show the button if it's the user's own profile
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
      } ${isAIUser ? 'border-blue-200 hover:border-blue-300' : ''}`}
      disabled={isLoading}
    >
      {isAIUser && <Bot className="h-3 w-3 text-blue-500" />}
      {isFollowing ? (
        <UserCheck className="h-4 w-4 text-green-500" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

export default EnhancedFollowButton;
