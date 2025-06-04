
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

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    posts.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );

  const visiblePosts = posts.slice(startIndex, endIndex);

  // Handle scroll events
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    setScrollTop(newScrollTop);

    // Check if near bottom for infinite scroll
    const threshold = 200; // pixels from bottom
    const isNear = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
    setIsNearBottom(isNear);

    if (isNear && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
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

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`VirtualizedList render time: ${endTime - startTime}ms`);
    };
  });

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

      {/* Loading indicator for infinite scroll */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loading variant="spinner" text="Loading more posts..." />
        </div>
      )}

      {/* Performance info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
          Rendering: {startIndex}-{endIndex} of {posts.length}
        </div>
      )}
    </div>
  );
}
