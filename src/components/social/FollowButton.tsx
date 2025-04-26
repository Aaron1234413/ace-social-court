
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
}

const FollowButton = ({ userId, isFollowing: initialIsFollowing }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const handleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      toast.success("User unfollowed");
    } else {
      setIsFollowing(true);
      toast.success("User followed!");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleFollow}
      className="flex items-center gap-1"
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
