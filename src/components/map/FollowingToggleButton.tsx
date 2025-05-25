
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';

const FollowingToggleButton: React.FC = () => {
  const { filters, handleFilterChange, user } = useMapExplorer();

  // Don't show if user is not logged in
  if (!user) return null;

  const isShowingFollowing = filters.showFollowing || false;

  return (
    <Button
      variant={isShowingFollowing ? "default" : "outline"}
      size="sm"
      onClick={() => handleFilterChange('showFollowing', !isShowingFollowing)}
      className="flex items-center gap-2"
    >
      <Heart 
        className={`h-4 w-4 ${isShowingFollowing ? 'fill-current' : ''}`} 
      />
      {isShowingFollowing ? 'Showing Following' : 'Show Following'}
    </Button>
  );
};

export default FollowingToggleButton;
