
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface UserFollowData {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_ai_user?: boolean;
    ai_personality_type?: string | null;
  } | null;
  following?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_ai_user?: boolean;
    ai_personality_type?: string | null;
  } | null;
}

interface AIUserSocialService {
  handleAutomaticFollowBack: (followerId: string, aiUserId: string) => Promise<boolean>;
}

// Simple implementation to avoid circular dependencies
const createAIService = (): AIUserSocialService => ({
  handleAutomaticFollowBack: async (followerId: string, aiUserId: string): Promise<boolean> => {
    try {
      const { data: aiProfile } = await supabase
        .from('profiles')
        .select('ai_personality_type')
        .eq('id', aiUserId)
        .eq('is_ai_user', true)
        .single();

      if (!aiProfile) return false;

      // Different personalities have different follow-back rates
      const followBackRates: Record<string, number> = {
        encouraging_coach: 0.8,
        strategic_player: 0.6,
        fitness_focused: 0.9,
        veteran_mentor: 0.7,
        technique_specialist: 0.5,
        recreational_enthusiast: 0.95
      };

      const followBackChance = followBackRates[aiProfile.ai_personality_type] || 0.7;
      
      if (Math.random() < followBackChance) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));

        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: aiUserId,
            following_id: followerId
          });

        return !error;
      }
      
      return false;
    } catch (error) {
      console.error('Error in automatic follow back:', error);
      return false;
    }
  }
});

export function useUserFollows() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const aiService = createAIService();

  const followersQuery = useQuery({
    queryKey: ['user-followers', user?.id],
    queryFn: async (): Promise<UserFollowData[]> => {
      if (!user?.id) return [];

      // Get followers with profile data using a proper join
      const { data: followers, error } = await supabase
        .from('followers')
        .select('id, follower_id, following_id, created_at')
        .eq('following_id', user.id);

      if (error) {
        console.error('Error fetching followers:', error);
        throw error;
      }

      if (!followers || followers.length === 0) return [];

      // Get follower profile data separately
      const followerIds = followers.map(f => f.follower_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, is_ai_user, ai_personality_type')
        .in('id', followerIds);

      // Combine the data
      const result = followers.map(follow => ({
        ...follow,
        follower: profiles?.find(p => p.id === follow.follower_id) || null
      }));

      return result;
    },
    enabled: !!user?.id,
  });

  const followingQuery = useQuery({
    queryKey: ['user-following', user?.id],
    queryFn: async (): Promise<UserFollowData[]> => {
      if (!user?.id) return [];

      // Get following with profile data using a proper join
      const { data: following, error } = await supabase
        .from('followers')
        .select('id, follower_id, following_id, created_at')
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching following:', error);
        throw error;
      }

      if (!following || following.length === 0) return [];

      // Get following profile data separately
      const followingIds = following.map(f => f.following_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, is_ai_user, ai_personality_type')
        .in('id', followingIds);

      // Combine the data
      const result = following.map(follow => ({
        ...follow,
        following: profiles?.find(p => p.id === follow.following_id) || null
      }));

      return result;
    },
    enabled: !!user?.id,
  });

  const followUser = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (error) throw error;
      
      return targetUserId;
    },
    onSuccess: async (targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['user-following'] });
      queryClient.invalidateQueries({ queryKey: ['user-followers'] });
      
      // Check if the followed user is an AI user and trigger follow back
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('is_ai_user')
        .eq('id', targetUserId)
        .single();

      if (targetProfile?.is_ai_user && user?.id) {
        // Trigger AI follow back with delay
        setTimeout(() => {
          aiService.handleAutomaticFollowBack(user.id, targetUserId);
        }, Math.random() * 15000 + 5000); // 5-20 seconds delay
      }
      
      toast.success('Successfully followed user');
    },
    onError: (error) => {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    },
  });

  const unfollowUser = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-following'] });
      queryClient.invalidateQueries({ queryKey: ['user-followers'] });
      toast.success('Successfully unfollowed user');
    },
    onError: (error) => {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    },
  });

  // Get AI users in following list
  const aiUsersFollowing = followingQuery.data?.filter(follow => 
    follow.following?.is_ai_user
  ) || [];

  // Get real users in following list
  const realUsersFollowing = followingQuery.data?.filter(follow => 
    !follow.following?.is_ai_user
  ) || [];

  return {
    followers: followersQuery.data || [],
    following: followingQuery.data || [],
    aiUsersFollowing,
    realUsersFollowing,
    followersCount: followersQuery.data?.length || 0,
    followingCount: followingQuery.data?.length || 0,
    aiFollowingCount: aiUsersFollowing.length,
    realFollowingCount: realUsersFollowing.length,
    isLoadingFollowers: followersQuery.isLoading,
    isLoadingFollowing: followingQuery.isLoading,
    followUser: followUser.mutate,
    unfollowUser: unfollowUser.mutate,
    isFollowing: followUser.isPending,
    isUnfollowing: unfollowUser.isPending,
  };
}

export function useIsFollowing(targetUserId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-following', user?.id, targetUserId],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !targetUserId) return false;

      const { data, error } = await supabase
        .rpc('is_following', {
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id && !!targetUserId,
  });
}
