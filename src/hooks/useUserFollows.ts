
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { UserFollow } from '@/types/post';
import { toast } from 'sonner';
import { AIUserSocialService } from '@/services/AIUserSocialService';

export function useUserFollows() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const aiSocialService = AIUserSocialService.getInstance();

  const followersQuery = useQuery({
    queryKey: ['user-followers', user?.id],
    queryFn: async (): Promise<UserFollow[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('followers')
        .select(`
          *,
          follower:profiles!followers_follower_id_fkey(
            id, full_name, username, avatar_url, is_ai_user, ai_personality_type
          )
        `)
        .eq('following_id', user.id);

      if (error) {
        console.error('Error fetching followers:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  const followingQuery = useQuery({
    queryKey: ['user-following', user?.id],
    queryFn: async (): Promise<UserFollow[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('followers')
        .select(`
          *,
          following:profiles!followers_following_id_fkey(
            id, full_name, username, avatar_url, is_ai_user, ai_personality_type
          )
        `)
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching following:', error);
        throw error;
      }

      return data || [];
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
          aiSocialService.handleAutomaticFollowBack(user.id, targetUserId);
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
