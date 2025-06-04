
import React from 'react';
import { Card } from '@/components/ui/card';
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
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-sm transition-all duration-200 w-full border-gray-200",
        contentType === 'ambassador' && "border-l-2 border-l-purple-400 bg-gradient-to-r from-purple-25 to-white",
        contentType === 'fallback' && "border-l-2 border-l-blue-400 bg-gradient-to-r from-blue-25 to-white",
        className
      )}
      style={style}
    >
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
    </Card>
  );
}
