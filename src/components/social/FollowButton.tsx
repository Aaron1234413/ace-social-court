
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
}

const FollowButton = ({ userId, username, fullName, isFollowing: initialIsFollowing }: FollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
  const [isLoading, setIsLoading] = useState(true);
  const { createNotification } = useNotifications();

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user) return;
      
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
      setIsLoading(false);
    };

    checkFollowStatus();
  }, [userId, user]);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .match({ follower_id: user.id, following_id: userId });

        if (error) throw error;
        setIsFollowing(false);
        toast.success("User unfollowed");
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({ follower_id: user.id, following_id: userId });

        if (error) throw error;
        setIsFollowing(true);
        toast.success("User followed!");
        
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
      toast.error("Failed to update follow status");
    }
  };

  if (isLoading) {
    return <Button variant="ghost" size="sm" disabled>Loading...</Button>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleFollow}
      className="flex items-center gap-1"
      disabled={userId === user?.id}
    >
      {isFollowing ? (
        <UserCheck className="h-4 w-4 text-green-500" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;
