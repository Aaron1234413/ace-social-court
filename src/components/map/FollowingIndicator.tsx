
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Heart, Users } from 'lucide-react';

interface FollowingIndicatorProps {
  followingCount: number;
  totalUsers: number;
  isShowingFollowing: boolean;
  isLoading: boolean;
}

const FollowingIndicator: React.FC<FollowingIndicatorProps> = ({
  followingCount,
  totalUsers,
  isShowingFollowing,
  isLoading
}) => {
  if (!isShowingFollowing) return null;

  return (
    <div className="bg-card rounded-lg border shadow-sm p-3 mb-4">
      <div className="flex items-center gap-2 text-sm">
        <Heart className="h-4 w-4 text-red-500 fill-current" />
        <span className="font-medium">Following Filter Active</span>
      </div>
      
      <div className="mt-2 flex items-center gap-2">
        {isLoading ? (
          <Badge variant="outline" className="animate-pulse">
            Loading...
          </Badge>
        ) : (
          <>
            <Badge variant="default" className="bg-blue-500">
              <Users className="h-3 w-3 mr-1" />
              {followingCount} followed users with locations
            </Badge>
            
            <Badge variant="outline">
              {totalUsers} shown on map
            </Badge>
          </>
        )}
      </div>
      
      {!isLoading && followingCount === 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          No followed users have location data available. Try following some players or coaches who share their location.
        </p>
      )}
    </div>
  );
};

export default FollowingIndicator;
