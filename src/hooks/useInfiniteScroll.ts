
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
  const initializedRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!onLoadMore || loadingRef.current || !hasMore || currentPage > maxPages) {
      console.log('🚫 LoadMore blocked:', {
        hasOnLoadMore: !!onLoadMore,
        isLoading: loadingRef.current,
        hasMore,
        currentPage,
        maxPages
      });
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      console.log(`📥 Infinite Scroll: Loading page ${currentPage} with ${pageSize} posts`);
      const startTime = performance.now();
      
      const newPosts = await onLoadMore(currentPage);
      
      const loadTime = performance.now() - startTime;
      console.log(`⏱️ Infinite Scroll: Page ${currentPage} loaded in ${loadTime.toFixed(2)}ms`);
      console.log(`📊 Infinite Scroll: Received ${newPosts.length} posts from page ${currentPage}`);

      if (newPosts.length === 0) {
        setHasMore(false);
        console.log('🏁 Infinite Scroll: No more posts available');
      } else {
        setPosts(prevPosts => {
          // Prevent duplicate posts
          const existingIds = new Set(prevPosts.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          
          console.log(`🔄 Infinite Scroll: Adding ${uniqueNewPosts.length} unique posts (${newPosts.length - uniqueNewPosts.length} duplicates filtered)`);
          
          const updatedPosts = [...prevPosts, ...uniqueNewPosts];
          console.log(`📈 Infinite Scroll: Total posts now: ${updatedPosts.length}`);
          
          return updatedPosts;
        });
        
        setCurrentPage(prev => prev + 1);
        
        // Check if we got fewer posts than expected (likely last page)
        if (newPosts.length < pageSize) {
          console.log(`🔚 Infinite Scroll: Partial page received (${newPosts.length}/${pageSize}), marking as last page`);
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('❌ Infinite Scroll: Error loading more posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, hasMore, maxPages, onLoadMore, pageSize]);

  const reset = useCallback(() => {
    console.log('🔄 Infinite Scroll: Resetting state');
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    loadingRef.current = false;
    initializedRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    console.log('🔄 Infinite Scroll: Refreshing posts');
    reset();
    
    // Load first page immediately after reset
    if (onLoadMore) {
      try {
        loadingRef.current = true;
        setIsLoading(true);
        setError(null);
        
        console.log('📥 Infinite Scroll: Loading initial page');
        const initialPosts = await onLoadMore(1);
        
        console.log(`📊 Infinite Scroll: Initial load received ${initialPosts.length} posts`);
        
        setPosts(initialPosts);
        setCurrentPage(2); // Next page to load is page 2
        initializedRef.current = true;
        
        if (initialPosts.length === 0) {
          setHasMore(false);
          console.log('🏁 Infinite Scroll: No posts available');
        } else if (initialPosts.length < pageSize) {
          setHasMore(false);
          console.log('🔚 Infinite Scroll: First page was partial, no more pages');
        }
      } catch (err) {
        console.error('❌ Infinite Scroll: Error loading initial posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
        setHasMore(false);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [reset, onLoadMore, pageSize]);

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
