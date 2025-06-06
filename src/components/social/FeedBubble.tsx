
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Post } from '@/types/post';
import { BubbleHeader } from './bubble/BubbleHeader';
import { BubbleContent } from './bubble/BubbleContent';
import { BubbleFooter } from './bubble/BubbleFooter';
import { AmbassadorBorder } from './AmbassadorBadge';
import { cn } from '@/lib/utils';
import { Clock, Sparkles } from 'lucide-react';

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
  
  // Check if ambassador content is fresh (less than 6 hours old)
  const isFreshAmbassadorContent = isAmbassador && (() => {
    const postAge = Date.now() - new Date(post.created_at).getTime();
    return postAge < 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  })();

  // Rotation logic: Show either "Fresh Content" OR "Featured Content", not both
  // Use post ID to create a consistent rotation pattern
  const showFreshContentIndicator = isFreshAmbassadorContent && isPriorityAmbassador ? 
    parseInt(post.id.slice(-1), 16) % 2 === 0 : // Even hash = fresh content
    isFreshAmbassadorContent; // If not priority, always show fresh if applicable

  const showFeaturedContentIndicator = isPriorityAmbassador && !showFreshContentIndicator;

  const cardContent = (
    <Card 
      className={cn(
        "overflow-visible hover:shadow-md transition-all duration-300 w-full border-muted/70 relative",
        // Smooth fade-in animation for all posts
        "animate-fade-in",
        // Enhanced animation for fresh ambassador content
        isFreshAmbassadorContent && "animate-[fade-in_0.5s_ease-out,scale-in_0.3s_ease-out]",
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
      {/* Fresh Ambassador Content Indicator - Only show if rotation selects it */}
      {showFreshContentIndicator && (
        <div className="absolute -top-2 right-4 z-10">
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-purple-100 to-amber-100 text-purple-800 border-purple-200/60 text-xs px-2 py-1 animate-pulse-subtle"
          >
            <Sparkles className="h-3 w-3 mr-1 animate-bounce-subtle" />
            Fresh Content
          </Badge>
        </div>
      )}

      {/* Featured Content Indicator - Only show if rotation selects it */}
      {showFeaturedContentIndicator && (
        <div className="absolute -top-2 right-4 z-10">
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-amber-100 to-purple-100 text-amber-800 border-amber-200/60 text-xs px-2 py-1"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Featured Content
          </Badge>
        </div>
      )}

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
        className={cn(
          className,
          // Enhanced hover effect for fresh ambassador content
          isFreshAmbassadorContent && "hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
        )}
      >
        {cardContent}
      </AmbassadorBorder>
    );
  }

  return cardContent;
}
