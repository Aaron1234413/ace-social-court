
import React from 'react';
import { Post } from '@/types/post';
import { BubbleHeader } from './bubble/BubbleHeader';
import { BubbleContent } from './bubble/BubbleContent';
import { BubbleFooter } from './bubble/BubbleFooter';
import { cn } from '@/lib/utils';

export type ContentType = 'user' | 'ambassador' | 'fallback';

interface FeedBubbleProps {
  post: Post;
  currentUserId?: string;
  contentType?: ContentType;
  onPostUpdated?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function FeedBubble({ 
  post, 
  currentUserId, 
  contentType = 'user',
  onPostUpdated,
  className,
  style 
}: FeedBubbleProps) {
  return (
    <div 
      className={cn("feed-bubble", className)}
      style={style}
    >
      <div className="bubble-inner">
        <BubbleHeader 
          post={post} 
          currentUserId={currentUserId}
          contentType={contentType}
          onPostUpdated={onPostUpdated}
        />
        
        <BubbleContent post={post} />
        
        <BubbleFooter 
          post={post} 
          currentUserId={currentUserId}
          contentType={contentType}
        />
      </div>
    </div>
  );
}
