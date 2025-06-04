
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Post } from '@/types/post';
import { FeedBubble } from './FeedBubble';
import { Loading } from '@/components/ui/loading';

interface VirtualizedListProps {
  posts: Post[];
  currentUserId?: string;
  onPostUpdated?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
}

const ITEM_HEIGHT = 300; // Estimated height per post
const BUFFER_SIZE = 3; // Number of items to render outside viewport

export function VirtualizedList({
  posts,
  currentUserId,
  onPostUpdated,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className = ''
}: VirtualizedListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const loadingRef = useRef(false);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    posts.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );

  const visiblePosts = posts.slice(startIndex, endIndex);

  // Handle scroll events with improved load more logic
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    setScrollTop(newScrollTop);

    // Check if near bottom for infinite scroll
    const threshold = 200; // pixels from bottom
    const isNear = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
    setIsNearBottom(isNear);

    // Trigger load more when near bottom
    if (isNear && hasMore && !isLoading && !loadingRef.current && onLoadMore) {
      console.log('📜 VirtualizedList: Triggering load more');
      loadingRef.current = true;
      onLoadMore();
      
      // Reset loading ref after a delay to prevent rapid fire
      setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Set up container height and scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updateHeight);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Debug logging for virtualized list state
  useEffect(() => {
    console.log('📜 VirtualizedList state:', {
      totalPosts: posts.length,
      visibleRange: `${startIndex}-${endIndex}`,
      visibleCount: visiblePosts.length,
      hasMore,
      isLoading,
      isNearBottom
    });
  }, [posts.length, startIndex, endIndex, visiblePosts.length, hasMore, isLoading, isNearBottom]);

  const totalHeight = posts.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      {/* Virtual spacer for total content height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <div className="space-y-6 md:space-y-8">
            {visiblePosts.map((post, index) => (
              <div
                key={post.id}
                style={{ minHeight: ITEM_HEIGHT }}
                className="transition-opacity duration-200"
              >
                <FeedBubble
                  post={post}
                  currentUserId={currentUserId}
                  index={startIndex + index}
                  onPostUpdated={onPostUpdated}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator for infinite scroll - only show when actually loading and has more */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-4 bg-background/80 backdrop-blur-sm">
          <Loading variant="spinner" text="Loading more posts..." />
        </div>
      )}

      {/* End of feed indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="flex justify-center py-6 text-muted-foreground text-sm">
          You've reached the end of your feed
        </div>
      )}

      {/* Performance info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
          <div>Rendering: {startIndex}-{endIndex} of {posts.length}</div>
          <div>Loading: {isLoading ? 'Yes' : 'No'} | Has More: {hasMore ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}
