
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Post } from '@/types/post';
import { BubbleHeader } from './bubble/BubbleHeader';
import { BubbleContent } from './bubble/BubbleContent';
import { BubbleFooter } from './bubble/BubbleFooter';
import { AmbassadorBorder } from './AmbassadorBadge';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

export type ContentType = 'user' | 'ambassador' | 'fallback';

interface FeedBubbleProps {
  post: Post & { isOptimistic?: boolean };
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
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');

  const handleSuggestionSelect = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
  };

  const handleSuggestionUsed = () => {
    setSelectedSuggestion('');
  };

  const isOptimistic = 'isOptimistic' in post && post.isOptimistic;
  const isAmbassador = contentType === 'ambassador';
  const isPriorityAmbassador = isAmbassador && post.ambassador_priority;

  const cardContent = (
    <Card 
      className={cn(
        "overflow-visible hover:shadow-md transition-all duration-300 w-full border-muted/70 animate-slide-up relative",
        contentType === 'fallback' && "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-card",
        isOptimistic && "border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-card",
        // Remove old ambassador styling since we're using AmbassadorBorder
        !isAmbassador && className
      )}
      style={{ 
        ...style,
        zIndex: 'auto',
        isolation: 'isolate'
      }}
    >
      {/* Optimistic post indicator */}
      {isOptimistic && (
        <div className="absolute -top-2 left-4 z-10">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
            <Clock className="h-3 w-3 mr-1" />
            Your recent post
          </Badge>
        </div>
      )}

      <BubbleHeader 
        post={post} 
        currentUserId={currentUserId}
        contentType={contentType}
        onPostUpdated={onPostUpdated}
        onSuggestionSelect={handleSuggestionSelect}
      />
      
      <BubbleContent post={post} />
      
      <BubbleFooter 
        post={post} 
        currentUserId={currentUserId}
        contentType={contentType}
        selectedSuggestion={selectedSuggestion}
        onSuggestionUsed={handleSuggestionUsed}
      />
    </Card>
  );

  // Wrap ambassador posts with the distinctive border
  if (isAmbassador) {
    return (
      <AmbassadorBorder 
        priority={isPriorityAmbassador}
        className={className}
      >
        {cardContent}
      </AmbassadorBorder>
    );
  }

  return cardContent;
}
