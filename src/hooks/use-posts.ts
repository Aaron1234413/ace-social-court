
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
import { toast } from 'sonner';
import { personalizePostFeed, PersonalizationContext } from '@/utils/feedPersonalization';

interface UsePostsOptions {
  personalize?: boolean;
  sortBy?: 'recent' | 'popular' | 'commented';
}

export const usePosts = (options: UsePostsOptions = { personalize: true, sortBy: 'recent' }) => {
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

  // Function to sort posts based on sortBy option
  const sortPosts = (postsToSort: Post[], sortBy: string = 'recent') => {
    // Posts are already sorted by recent by default
    if (sortBy === 'recent') {
      return postsToSort;
    }

    return [...postsToSort]; // Return a copy to avoid mutating the original array
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      
      // Initial query
      let query = supabase.from('posts');
      
      // Select specific fields and include calculated fields for likes and comments
      let selectQuery = query.select(`
        id,
        content,
        created_at,
        user_id,
        media_url,
        media_type,
        updated_at`);
        
      // Add count of likes and comments using separate queries after fetching posts
      
      // Sort based on option
      if (options.sortBy === 'recent') {
        selectQuery = selectQuery.order('created_at', { ascending: false });
      }

      const { data: postsData, error: postsError } = await selectQuery;

      if (postsError) throw postsError;
      
      if (!postsData) {
        setPosts([]);
        return;
      }
      
      // Format posts and get likes/comments counts separately
      const formattedPosts: Post[] = await Promise.all(postsData.map(async post => {
        // Get likes count
        const { data: likesData } = await supabase
          .rpc('get_likes_count', { post_id: post.id });
          
        // Get comments count
        const { data: commentsData } = await supabase
          .rpc('get_comments_count', { post_id: post.id });
        
        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          user_id: post.user_id,
          media_url: post.media_url,
          media_type: post.media_type,
          author: null,
          likes_count: likesData || 0,
          comments_count: commentsData || 0
        };
      }));

      // Sort by popularity or comments if needed
      let sortedPosts = [...formattedPosts];
      
      if (options.sortBy === 'popular') {
        sortedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      } else if (options.sortBy === 'commented') {
        sortedPosts.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
      }

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
          
          sortedPosts.forEach(post => {
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
        const personalizedPosts = personalizePostFeed(sortedPosts, personalizationContext);
        setPosts(personalizedPosts);
      } else {
        // If no personalization or not logged in, just show the posts in sorted order
        setPosts(sortedPosts);
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
  }, [options.personalize, options.sortBy]);

  return { 
    posts, 
    isLoading, 
    fetchPosts,
    userFollowings,
    userProfile
  };
};
