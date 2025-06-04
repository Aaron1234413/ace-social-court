
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
  
  // Use ref to prevent duplicate loading
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    // Prevent duplicate calls
    if (!onLoadMore || isLoadingRef.current || !hasMore || currentPage > maxPages) {
      console.log('🚫 LoadMore blocked:', {
        hasOnLoadMore: !!onLoadMore,
        isLoadingInProgress: isLoadingRef.current,
        hasMore,
        currentPage,
        maxPages
      });
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      console.log(`📥 Loading page ${currentPage}...`);
      const newPosts = await onLoadMore(currentPage);
      console.log(`📊 Received ${newPosts.length} posts for page ${currentPage}`);

      if (newPosts.length === 0) {
        console.log('🏁 No more posts - setting hasMore to false');
        setHasMore(false);
      } else {
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          
          console.log(`🔄 Adding ${uniqueNewPosts.length} unique posts`);
          return [...prevPosts, ...uniqueNewPosts];
        });
        
        setCurrentPage(prev => prev + 1);
        
        // If we got fewer posts than requested, we might be at the end
        if (newPosts.length < pageSize) {
          console.log(`🔚 Partial page received - might be last page`);
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('❌ Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      console.log('✅ Setting loading to false');
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [currentPage, hasMore, maxPages, onLoadMore, pageSize]);

  const reset = useCallback(() => {
    console.log('🔄 Resetting infinite scroll state');
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    isLoadingRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    console.log('🔄 Refreshing posts - full reset and reload');
    
    // Reset everything first
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    isLoadingRef.current = false;
    
    // Then load first page
    if (onLoadMore) {
      try {
        isLoadingRef.current = true;
        setIsLoading(true);
        
        console.log('📥 Loading initial page after refresh');
        const initialPosts = await onLoadMore(1);
        console.log(`📊 Initial refresh load: ${initialPosts.length} posts`);
        
        if (initialPosts.length === 0) {
          console.log('📭 No initial posts found');
          setHasMore(false);
        } else {
          setPosts(initialPosts);
          setCurrentPage(2);
          
          if (initialPosts.length < pageSize) {
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error('❌ Error during refresh:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh posts');
        setHasMore(false);
      } finally {
        console.log('✅ Refresh complete - setting loading to false');
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [onLoadMore, pageSize]);

  console.log('🔍 useInfiniteScroll state:', {
    postsCount: posts.length,
    currentPage,
    isLoading,
    hasMore,
    isLoadingRef: isLoadingRef.current,
    error: !!error
  });

  return {
    posts,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
    currentPage: currentPage - 1,
    totalPosts: posts.length
  };
}
