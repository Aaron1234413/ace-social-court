
import { useState, useCallback, useRef } from 'react';
import { Post } from '@/types/post';

interface OptimisticPost extends Post {
  isOptimistic: true;
  addedAt: number;
}

export const useOptimisticPosts = () => {
  const [optimisticPosts, setOptimisticPosts] = useState<OptimisticPost[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addOptimisticPost = useCallback((post: Post) => {
    const optimisticPost: OptimisticPost = {
      ...post,
      isOptimistic: true,
      addedAt: Date.now()
    };

    setOptimisticPosts(prev => [optimisticPost, ...prev]);

    // Remove after 30 seconds
    const timeout = setTimeout(() => {
      setOptimisticPosts(prev => prev.filter(p => p.id !== post.id));
      timeoutRefs.current.delete(post.id);
    }, 30000);

    timeoutRefs.current.set(post.id, timeout);
  }, []);

  const removeOptimisticPost = useCallback((postId: string) => {
    const timeout = timeoutRefs.current.get(postId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(postId);
    }
    setOptimisticPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  const clearAllOptimistic = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setOptimisticPosts([]);
  }, []);

  return {
    optimisticPosts,
    addOptimisticPost,
    removeOptimisticPost,
    clearAllOptimistic
  };
};
