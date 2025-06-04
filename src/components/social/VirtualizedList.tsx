
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

const ITEM_HEIGHT = 300;
const BUFFER_SIZE = 3;

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
  const loadMoreTriggeredRef = useRef(false);

  console.log('📜 VirtualizedList render:', { 
    postsCount: posts.length, 
    hasMore, 
    isLoading,
    loadMoreTriggered: loadMoreTriggeredRef.current
  });

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    posts.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );

  const visiblePosts = posts.slice(startIndex, endIndex);

  // Handle scroll with simplified load more trigger
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    setScrollTop(newScrollTop);

    // Check if near bottom
    const threshold = 200;
    const isNearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;

    // Trigger load more only once when conditions are met
    if (isNearBottom && hasMore && !isLoading && onLoadMore && !loadMoreTriggeredRef.current) {
      console.log('📜 Triggering load more from scroll');
      loadMoreTriggeredRef.current = true;
      onLoadMore();
      
      // Reset flag after a short delay
      setTimeout(() => {
        loadMoreTriggeredRef.current = false;
      }, 1000);
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Reset load more trigger when posts change or loading state changes
  useEffect(() => {
    if (!isLoading) {
      loadMoreTriggeredRef.current = false;
    }
  }, [isLoading, posts.length]);

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

  const totalHeight = posts.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
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

      {/* Simplified loading indicator - only show when actually loading AND we have more content */}
      {isLoading && hasMore && posts.length > 0 && (
        <div className="flex justify-center py-4 bg-background/80 backdrop-blur-sm">
          <Loading variant="spinner" text="Loading more posts..." />
        </div>
      )}

      {/* End of feed indicator */}
      {!hasMore && posts.length > 0 && !isLoading && (
        <div className="flex justify-center py-6 text-muted-foreground text-sm">
          You've reached the end of your feed
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono">
          <div>Posts: {posts.length}</div>
          <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
          <div>Has More: {hasMore ? 'YES' : 'NO'}</div>
          <div>Trigger: {loadMoreTriggeredRef.current ? 'ACTIVE' : 'READY'}</div>
        </div>
      )}
    </div>
  );
}
