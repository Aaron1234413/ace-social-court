
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { UserFollowData } from '@/types/post';
import { toast } from 'sonner';

export function useUserFollows() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const followersQuery = useQuery({
    queryKey: ['user-followers', user?.id],
    queryFn: async (): Promise<UserFollowData[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('followers')
        .select(`
          *,
          profiles!followers_follower_id_fkey (
            id,
            full_name,
            username,
            avatar_url,
            is_ai_user,
            ai_personality_type
          )
        `)
        .eq('following_id', user.id);

      if (error) {
        console.error('Error fetching followers:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        follower: item.profiles ? {
          id: item.profiles.id,
          full_name: item.profiles.full_name,
          username: item.profiles.username,
          avatar_url: item.profiles.avatar_url,
          is_ai_user: item.profiles.is_ai_user,
          ai_personality_type: item.profiles.ai_personality_type
        } : undefined
      }));
    },
    enabled: !!user?.id,
  });

  const followingQuery = useQuery({
    queryKey: ['user-following', user?.id],
    queryFn: async (): Promise<UserFollowData[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('followers')
        .select(`
          *,
          profiles!followers_following_id_fkey (
            id,
            full_name,
            username,
            avatar_url,
            is_ai_user,
            ai_personality_type
          )
        `)
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching following:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        following: item.profiles ? {
          id: item.profiles.id,
          full_name: item.profiles.full_name,
          username: item.profiles.username,
          avatar_url: item.profiles.avatar_url,
          is_ai_user: item.profiles.is_ai_user,
          ai_personality_type: item.profiles.ai_personality_type
        } : undefined
      }));
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

      // Check if target is AI user and trigger automated response
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('is_ai_user, ai_personality_type')
        .eq('id', targetUserId)
        .single();

      if (targetProfile?.is_ai_user) {
        // Trigger AI follow back after a short delay
        setTimeout(async () => {
          await supabase
            .from('followers')
            .insert({
              follower_id: targetUserId,
              following_id: user.id,
            });
        }, Math.random() * 5000 + 2000); // 2-7 seconds delay
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-following'] });
      queryClient.invalidateQueries({ queryKey: ['user-followers'] });
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

  return {
    followers: followersQuery.data || [],
    following: followingQuery.data || [],
    followersCount: followersQuery.data?.length || 0,
    followingCount: followingQuery.data?.length || 0,
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
