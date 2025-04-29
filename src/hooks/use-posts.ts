
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
import { toast } from 'sonner';
import { personalizePostFeed, PersonalizationContext } from '@/utils/feedPersonalization';

interface UsePostsOptions {
  personalize?: boolean;
}

export const usePosts = (options: UsePostsOptions = { personalize: true }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userFollowings, setUserFollowings] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<{ user_type: string | null } | null>(null);
  
  // Fetch user followings for personalization
  const fetchUserFollowings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);
      
      if (error) throw error;
      
      return data.map(item => item.following_id);
    } catch (error) {
      console.error('Error fetching user followings:', error);
      return [];
    }
  };
  
  // Fetch user profile for personalization
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, content, created_at, user_id, media_url, media_type, updated_at')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      
      if (!postsData) {
        setPosts([]);
        return;
      }
      
      const formattedPosts: Post[] = postsData.map(post => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        user_id: post.user_id,
        media_url: post.media_url,
        media_type: post.media_type,
        author: null
      }));

      if (formattedPosts.length > 0) {
        const userIds = formattedPosts.map(post => post.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, user_type')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const profileMap = new Map();
          profilesData.forEach(profile => {
            profileMap.set(profile.id, {
              full_name: profile.full_name,
              user_type: profile.user_type
            });
          });
          
          formattedPosts.forEach(post => {
            post.author = profileMap.get(post.user_id) || null;
          });
        } else {
          console.error('Error fetching profiles:', profilesError);
        }
      }
      
      // Get current user from supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      // If personalization is enabled and user is logged in
      if (options.personalize && user) {
        // Fetch user followings and profile for personalization context
        const followings = await fetchUserFollowings(user.id);
        const profile = await fetchUserProfile(user.id);
        
        setUserFollowings(followings);
        setUserProfile(profile);
        
        const personalizationContext: PersonalizationContext = {
          currentUserId: user.id,
          userFollowings: followings,
          userType: profile?.user_type
        };
        
        // Personalize the feed
        const personalizedPosts = personalizePostFeed(formattedPosts, personalizationContext);
        setPosts(personalizedPosts);
      } else {
        // If no personalization or not logged in, just show the posts in chronological order
        setPosts(formattedPosts);
      }
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return { 
    posts, 
    isLoading, 
    fetchPosts,
    userFollowings,
    userProfile
  };
};
