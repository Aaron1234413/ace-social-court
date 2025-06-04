
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
  const isAmbassadorContent = contentType === 'ambassador';
  
  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-md transition-all duration-200 w-full border-gray-200 mb-3",
        // Enhanced Ambassador Treatment - Premium styling
        isAmbassadorContent && [
          "border-l-4 border-l-purple-500",
          "bg-gradient-to-r from-purple-50/50 via-white to-white",
          "shadow-sm hover:shadow-lg",
          "ring-1 ring-purple-100"
        ],
        // Fallback content styling
        contentType === 'fallback' && [
          "border-l-4 border-l-blue-400",
          "bg-gradient-to-r from-blue-50/30 to-white"
        ],
        // Compact spacing
        "space-y-0",
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
