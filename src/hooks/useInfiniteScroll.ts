
import { useState, useCallback, useRef } from 'react';
import { Post } from '@/types/post';

interface UseInfiniteScrollOptions {
  pageSize?: number;
  onLoadMore?: (page: number) => Promise<Post[]>;
  maxPages?: number;
}

export function useInfiniteScroll({
  pageSize = 10,
  onLoadMore,
  maxPages = 50
}: UseInfiniteScrollOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track loading state to prevent duplicate requests
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!onLoadMore || loadingRef.current || !hasMore || currentPage > maxPages) {
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      console.log(`Loading page ${currentPage} with ${pageSize} posts`);
      const startTime = performance.now();
      
      const newPosts = await onLoadMore(currentPage);
      
      const loadTime = performance.now() - startTime;
      console.log(`Page ${currentPage} loaded in ${loadTime.toFixed(2)}ms`);

      if (newPosts.length === 0) {
        setHasMore(false);
        console.log('No more posts available');
      } else {
        setPosts(prevPosts => {
          // Prevent duplicate posts
          const existingIds = new Set(prevPosts.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          
          return [...prevPosts, ...uniqueNewPosts];
        });
        
        setCurrentPage(prev => prev + 1);
        
        // Check if we got fewer posts than expected (likely last page)
        if (newPosts.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, hasMore, maxPages, onLoadMore, pageSize]);

  const reset = useCallback(() => {
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    loadingRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    reset();
    await loadMore();
  }, [reset, loadMore]);

  return {
    posts,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
    currentPage: currentPage - 1, // Return 0-based page for display
    totalPosts: posts.length
  };
}
