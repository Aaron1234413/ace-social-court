
import React from 'react';
import { Post } from '@/types/post';
import { BubbleHeader } from './bubble/BubbleHeader';
import { BubbleContent } from './bubble/BubbleContent';
import { BubbleFooter } from './bubble/BubbleFooter';
import { CoachControlOverlay } from './bubble/CoachControlOverlay';
import { Card } from '@/components/ui/card';

interface FeedBubbleProps {
  post: Post;
  currentUserId?: string;
  index?: number;
  onPostUpdated?: () => void;
}

export function FeedBubble({ post, currentUserId, index = 0, onPostUpdated }: FeedBubbleProps) {
  const isOwnPost = currentUserId === post.user_id;
  const isCoachUser = post.author?.user_type === 'coach';
  
  return (
    <Card 
      className="relative overflow-hidden hover:shadow-md transition-all duration-300 w-full border-muted/70 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Coach Control Overlay - only shows for coach users */}
      {isCoachUser && currentUserId && (
        <CoachControlOverlay 
          post={post} 
          currentUserId={currentUserId}
          onPostUpdated={onPostUpdated}
        />
      )}
      
      <BubbleHeader 
        post={post} 
        currentUserId={currentUserId}
        onPostUpdated={onPostUpdated}
      />
      
      <BubbleContent post={post} />
      
      <BubbleFooter post={post} currentUserId={currentUserId} />
    </Card>
  );
}
