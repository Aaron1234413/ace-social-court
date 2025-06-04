
import { useState, useEffect } from 'react';
import { PreviewService } from '@/services/PreviewService';
import { PrivacyContext } from '@/utils/privacySanitization';
import { useAuth } from '@/components/AuthProvider';
import { useUserFollows } from '@/hooks/useUserFollows';

interface PreviewData {
  content: string;
  author: {
    full_name: string;
    avatar_url?: string;
    user_type?: string;
  };
  engagement: {
    likes_count: number;
    comments_count: number;
  };
  privacy_level: string;
  created_at: string;
  is_fallback: boolean;
  fallback_reason?: string;
}

interface UsePostPreviewResult {
  preview: PreviewData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  cacheStats: {
    totalEntries: number;
    memoryUsage: number;
    maxSize: number;
    fillPercentage: number;
  };
}

export const usePostPreview = (postId: string | null): UsePostPreviewResult => {
  const { user, profile } = useAuth();
  const { following } = useUserFollows();
  
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewService = PreviewService.getInstance();

  const fetchPreview = async (forceRefresh = false) => {
    if (!postId) return;

    setIsLoading(true);
    setError(null);

    try {
      const followingIds = following.map(f => f.following_id);
      const context: PrivacyContext = {
        currentUserId: user?.id,
        userFollowings: followingIds,
        userType: profile?.user_type,
        isCoach: profile?.user_type === 'coach'
      };

      const previewData = await previewService.getPostPreview(
        postId, 
        context, 
        forceRefresh
      );
      
      setPreview(previewData);
    } catch (err) {
      console.error('Failed to fetch post preview:', err);
      setError('Failed to load preview');
      
      // Still set a fallback preview even on error
      setPreview({
        content: 'Preview temporarily unavailable',
        author: {
          full_name: 'Rally Player'
        },
        engagement: {
          likes_count: 0,
          comments_count: 0
        },
        privacy_level: 'private',
        created_at: new Date().toISOString(),
        is_fallback: true,
        fallback_reason: 'Service error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [postId, user?.id, following.length, profile?.user_type]);

  const refetch = () => {
    fetchPreview(true);
  };

  const cacheStats = previewService.getCacheStats();

  return {
    preview,
    isLoading,
    error,
    refetch,
    cacheStats
  };
};
