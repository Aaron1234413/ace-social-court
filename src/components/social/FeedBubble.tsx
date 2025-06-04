
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
        "overflow-visible hover:shadow-md transition-all duration-300 w-full border-muted/70 animate-slide-up relative",
        contentType === 'ambassador' && "border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-card",
        contentType === 'fallback' && "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-card",
        className
      )}
      style={{ 
        ...style,
        zIndex: 'auto',
        isolation: 'isolate'
      }}
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
