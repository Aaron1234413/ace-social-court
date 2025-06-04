
import React from 'react';
import { Post } from '@/types/post';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';

interface CoachControlOverlayProps {
  post: Post;
  currentUserId: string;
  onPostUpdated?: () => void;
}

export function CoachControlOverlay({ post, currentUserId, onPostUpdated }: CoachControlOverlayProps) {
  // Only show for coach users
  if (post.author?.user_type !== 'coach') {
    return null;
  }

  return (
    <div className="absolute top-2 left-2 z-10">
      <Badge 
        variant="secondary" 
        className="bg-purple-100 text-purple-800 border-purple-300 shadow-sm"
      >
        <GraduationCap className="h-3 w-3 mr-1" />
        Coach
      </Badge>
    </div>
  );
}
