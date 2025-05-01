import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
import { Skeleton } from '@/components/ui/skeleton';
import LikeButton from '@/components/social/LikeButton';
import CommentButton from '@/components/social/CommentButton';
import ShareButton from '@/components/social/ShareButton';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import PostContent from '@/components/social/PostContent';
import { PostActions } from '@/components/social/PostActions';
import { useNavigate } from 'react-router-dom';

const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: post, isLoading, error, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      // First, get the post data
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *
        `)
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      
      // Then, get the author data separately
      if (postData) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('full_name, user_type, avatar_url')
          .eq('id', postData.user_id)
          .single();
          
        // Get like count
        const { data: likesCount } = await supabase
          .rpc('get_likes_count', { post_id: postData.id });
          
        // Get comment count
        const { data: commentsCount } = await supabase
          .rpc('get_comments_count', { post_id: postData.id });
        
        // Construct the complete post object
        return {
          ...postData,
          author: authorData || { full_name: 'Unknown', user_type: 'player' },
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0
        } as Post;
      }
      
      return null;
    },
  });

  if (error) {
    console.error("Error loading post:", error);
    return <Navigate to="/404" />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="overflow-hidden animate-pulse p-6">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="ml-3">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-3 w-32 bg-gray-200 rounded mt-2"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-40 bg-gray-200 rounded w-full mt-4"></div>
        </Card>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/404" />;
  }
  
  // Handle post deletion by navigating back to the feed
  const handlePostDelete = () => {
    navigate('/feed');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {post.author?.full_name?.charAt(0) || '?'}
              </div>
              <div className="ml-3">
                <h3 className="font-semibold">{post.author?.full_name || 'Anonymous'}</h3>
                <p className="text-sm text-muted-foreground">
                  {post.author?.user_type === 'coach' ? 'Coach' : 'Player'} · {
                    formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                  }
                </p>
              </div>
            </div>
            
            {/* Add post actions if the current user is the post creator */}
            {user && user.id === post.user_id && (
              <PostActions 
                post={post} 
                onEdit={() => refetch()} 
                onDelete={handlePostDelete}
              />
            )}
          </div>

          {post.content && (
            <PostContent content={post.content} className="text-base break-words mb-4" />
          )}

          {post.media_url && (
            <div className="rounded-lg overflow-hidden mt-2 border border-gray-100">
              {post.media_type === 'image' ? (
                <img 
                  src={post.media_url} 
                  alt="Post media" 
                  className="w-full object-contain max-h-96"
                />
              ) : post.media_type === 'video' ? (
                <video 
                  src={post.media_url} 
                  controls 
                  className="w-full max-h-96"
                />
              ) : null}
            </div>
          )}

          <div className="mt-6 pt-4 border-t flex justify-between">
            {user && (
              <>
                <LikeButton postId={post.id} postUserId={post.user_id} postContent={post.content} />
                <CommentButton postId={post.id} postUserId={post.user_id} />
                <ShareButton postId={post.id} postContent={post.content} />
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PostDetail;
