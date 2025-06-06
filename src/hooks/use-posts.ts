import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
import { toast } from 'sonner';
import { personalizePostFeed, PersonalizationContext } from '@/utils/feedPersonalization';
import { sanitizePostsForUser, PrivacyContext } from '@/utils/privacySanitization';
import { createSmartFeedMix, ensureMinimumContent } from '@/utils/smartFeedMixing';

interface UsePostsOptions {
  personalize?: boolean;
  sortBy?: 'recent' | 'popular';
  respectPrivacy?: boolean;
}

// Helper function to transform legacy privacy levels to new simplified ones
const transformPrivacyLevel = (level: string): 'private' | 'public' | 'public_highlights' => {
  switch (level) {
    case 'public':
      return 'public';
    case 'public_highlights':
      return 'public_highlights';
    case 'friends':
    case 'coaches':
    case 'private':
    default:
      return 'private';
  }
};

export const usePosts = (options: UsePostsOptions = { 
  personalize: true, 
  sortBy: 'recent', 
  respectPrivacy: true 
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userFollowings, setUserFollowings] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<{ user_type: string | null } | null>(null);
  
  // Fetch user followings for personalization
  const fetchUserFollowings = async (userId: string) => {
    try {
      console.log('Fetching user followings for:', userId);
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);
      
      if (error) {
        console.error('Error fetching user followings:', error);
        return [];
      }
      
      const followings = data.map(item => item.following_id);
      console.log('User followings fetched:', followings.length);
      return followings;
    } catch (error) {
      console.error('Error fetching user followings:', error);
      return [];
    }
  };
  
  // Fetch user profile for personalization
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      console.log('User profile fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Starting post fetch with options:', options);
      
      // Get current user from supabase
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      
      // Fetch all posts first
      let query = supabase.from('posts');
      
      let selectQuery = query.select(`
        id,
        content,
        created_at,
        user_id,
        media_url,
        media_type,
        privacy_level,
        template_id,
        is_auto_generated,
        engagement_score,
        updated_at`);
        
      // Sort based on option - removed 'commented' sort option
      if (options.sortBy === 'recent') {
        selectQuery = selectQuery.order('created_at', { ascending: false });
      }

      const { data: postsData, error: postsError } = await selectQuery;

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }
      
      if (!postsData || postsData.length === 0) {
        console.log('No posts found in database');
        setPosts([]);
        return;
      }
      
      console.log('Raw posts fetched:', postsData.length);
      
      // Format posts and get likes/comments counts separately
      const formattedPosts: Post[] = await Promise.all(postsData.map(async post => {
        try {
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
            privacy_level: transformPrivacyLevel(post.privacy_level), // Transform legacy privacy levels
            template_id: post.template_id,
            is_auto_generated: post.is_auto_generated,
            engagement_score: post.engagement_score,
            author: null,
            likes_count: likesData || 0,
            comments_count: commentsData || 0
          };
        } catch (error) {
          console.error('Error processing post:', post.id, error);
          // Return post without counts if there's an error
          return {
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            user_id: post.user_id,
            media_url: post.media_url,
            media_type: post.media_type,
            privacy_level: transformPrivacyLevel(post.privacy_level), // Transform legacy privacy levels
            template_id: post.template_id,
            is_auto_generated: post.is_auto_generated,
            engagement_score: post.engagement_score,
            author: null,
            likes_count: 0,
            comments_count: 0
          };
        }
      }));

      console.log('Posts formatted with engagement data:', formattedPosts.length);

      
      // Sort by popularity if needed - removed comments sort option
      let sortedPosts = [...formattedPosts];
      
      if (options.sortBy === 'popular') {
        sortedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      }

      // Fetch author profiles
      if (sortedPosts.length > 0) {
        const userIds = [...new Set(sortedPosts.map(post => post.user_id))];
        console.log('Fetching profiles for users:', userIds.length);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, user_type, avatar_url')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const profileMap = new Map();
          profilesData.forEach(profile => {
            profileMap.set(profile.id, {
              full_name: profile.full_name,
              user_type: profile.user_type,
              avatar_url: profile.avatar_url
            });
          });
          
          sortedPosts.forEach(post => {
            post.author = profileMap.get(post.user_id) || null;
          });
        } else {
          console.error('Error fetching profiles:', profilesError);
        }
      }
      
      console.log('Posts with author data prepared:', sortedPosts.length);
      
      // Apply smart processing if user is logged in
      let finalPosts = sortedPosts;
      
      if (user) {
        try {
          // Fetch user context for personalization and privacy
          let followings = userFollowings;
          let profile = userProfile;
          
          if (followings.length === 0) {
            followings = await fetchUserFollowings(user.id);
            setUserFollowings(followings);
          }
          
          if (!profile) {
            profile = await fetchUserProfile(user.id);
            setUserProfile(profile);
          }
          
          console.log('User context established', {
            followings: followings.length,
            userType: profile?.user_type
          });
          
          // Apply privacy filtering if enabled
          if (options.respectPrivacy) {
            const privacyContext: PrivacyContext = {
              currentUserId: user.id,
              userFollowings: followings,
              userType: profile?.user_type,
              isCoach: profile?.user_type === 'coach'
            };
            
            const privacyFilteredPosts = sanitizePostsForUser(sortedPosts, privacyContext);
            console.log('Privacy filtering applied', {
              before: sortedPosts.length,
              after: privacyFilteredPosts.length
            });
            
            // Apply smart content mixing
            finalPosts = createSmartFeedMix(privacyFilteredPosts, {
              followingCount: followings.length,
              userFollowings: followings,
              currentUserId: user.id
            });
            
            // Ensure minimum content with fallback
            finalPosts = ensureMinimumContent(finalPosts, sortedPosts, user.id);
          }
          
          // Apply personalization if enabled
          if (options.personalize && finalPosts.length > 0) {
            const personalizationContext: PersonalizationContext = {
              currentUserId: user.id,
              userFollowings: followings,
              userType: profile?.user_type
            };
            
            finalPosts = personalizePostFeed(finalPosts, personalizationContext);
            console.log('Personalization applied to final posts:', finalPosts.length);
          }
        } catch (error) {
          console.error('Error in smart processing, using fallback:', error);
          // Fallback: show public posts only
          finalPosts = sortedPosts.filter(post => 
            post.privacy_level === 'public' || post.user_id === user.id
          );
        }
      } else {
        // For unauthenticated users, show only public posts
        finalPosts = sortedPosts.filter(post => post.privacy_level === 'public');
        console.log('Unauthenticated user - showing public posts only:', finalPosts.length);
      }
      
      console.log('Final posts to display:', finalPosts.length);
      setPosts(finalPosts);
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error("Failed to load posts");
      // Set empty array on error to prevent infinite loading
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [options.personalize, options.sortBy, options.respectPrivacy, userFollowings.length, userProfile?.user_type]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { 
    posts, 
    isLoading, 
    fetchPosts,
    userFollowings,
    userProfile
  };
};

// Add the missing useCreatePost hook
export const useCreatePost = () => {
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const createPost = async (postData: {
    content: string;
    media_url: string | null;
    media_type: string | null;
  }) => {
    try {
      setIsCreatingPost(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a post");
        return null;
      }
      
      console.log('Creating post with data:', postData);
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: postData.content,
          user_id: user.id,
          media_url: postData.media_url,
          media_type: postData.media_type
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }
      
      console.log('Post created successfully:', data);
      toast.success("Post created successfully!");
      return data;
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(`Failed to create post: ${error.message}`);
      return null;
    } finally {
      setIsCreatingPost(false);
    }
  };

  return { createPost, isCreatingPost };
};

export const useEditPost = () => {
  const [isEditing, setIsEditing] = useState(false);

  const editPost = async (
    postId: string,
    postData: {
      content: string;
      media_url?: string | null;
      media_type?: string | null;
    }
  ) => {
    try {
      setIsEditing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to edit a post");
        return null;
      }
      
      console.log('Editing post with data:', { postId, ...postData });
      
      // First check if the post belongs to the user
      const { data: postCheck, error: postCheckError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (postCheckError) {
        console.error('Error verifying post ownership:', postCheckError);
        toast.error("Error verifying post ownership");
        return null;
      }
      
      if (postCheck.user_id !== user.id) {
        toast.error("You can only edit your own posts");
        return null;
      }
      
      // Update the post
      const { data, error } = await supabase
        .from('posts')
        .update({
          content: postData.content,
          ...(postData.media_url !== undefined && { media_url: postData.media_url }),
          ...(postData.media_type !== undefined && { media_type: postData.media_type }),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error editing post:', error);
        throw error;
      }
      
      console.log('Post edited successfully:', data);
      toast.success("Post updated successfully!");
      return data;
    } catch (error: any) {
      console.error('Error editing post:', error);
      toast.error(`Failed to update post: ${error.message}`);
      return null;
    } finally {
      setIsEditing(false);
    }
  };

  return { editPost, isEditing };
};

export const useDeletePost = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePost = async (postId: string) => {
    try {
      setIsDeleting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to delete a post");
        return false;
      }
      
      console.log('Deleting post:', postId);
      
      // First check if the post belongs to the user
      const { data: postCheck, error: postCheckError } = await supabase
        .from('posts')
        .select('user_id, media_url, media_type')
        .eq('id', postId)
        .single();
      
      if (postCheckError) {
        console.error('Error verifying post ownership:', postCheckError);
        toast.error("Error verifying post ownership");
        return false;
      }
      
      if (postCheck.user_id !== user.id) {
        toast.error("You can only delete your own posts");
        return false;
      }
      
      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
      
      // If the post had media, consider deleting it from storage as well
      if (postCheck.media_url && postCheck.media_type) {
        const urlParts = postCheck.media_url.split('/');
        const filePath = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];
        
        const { error: storageError } = await supabase.storage
          .from('posts')
          .remove([filePath]);
        
        if (storageError) {
          console.error('Error deleting media file:', storageError);
        }
      }
      
      console.log('Post deleted successfully');
      toast.success("Post deleted successfully!");
      return true;
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(`Failed to delete post: ${error.message}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deletePost, isDeleting };
};
