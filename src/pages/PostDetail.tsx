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
import { ReactionBar } from '@/components/social/ReactionBar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import PostContent from '@/components/social/PostContent';
import { PostActions } from '@/components/social/PostActions';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { ContextPrompts } from '@/components/social/ContextPrompts';

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

  const isAmbassadorContent = post?.author?.user_type === 'ambassador' || post?.is_ambassador_content;

  return (
    <>
      <Helmet>
        <title>Post by {post?.author?.full_name || 'Anonymous'} - rallypointx</title>
        <meta name="description" content={post?.content?.substring(0, 160) || 'A post on rallypointx'} />
        <meta property="og:title" content={`Post by ${post?.author?.full_name || 'Anonymous'} - rallypointx`} />
        <meta property="og:description" content={post?.content?.substring(0, 160) || 'A post on rallypointx'} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`Post by ${post?.author?.full_name || 'Anonymous'} - rallypointx`} />
        <meta name="twitter:description" content={post?.content?.substring(0, 160) || 'A post on rallypointx'} />
      </Helmet>
      
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

            <div className="mt-6 pt-4 border-t space-y-4">
              {/* New Reaction Bar */}
              <ReactionBar
                postId={post.id}
                postUserId={post.user_id}
                postContent={post.content}
                privacyLevel={post.privacy_level}
                isAmbassadorContent={isAmbassadorContent}
                authorUserType={post.author?.user_type || undefined}
              />
              
              {/* Traditional Engagement Actions */}
              {user && (
                <div className="flex justify-between border-t pt-4">
                  <LikeButton postId={post.id} postUserId={post.user_id} postContent={post.content} />
                  <CommentButton postId={post.id} postUserId={post.user_id} />
                  <ShareButton postId={post.id} postContent={post.content} />
                </div>
              )}
            </div>
          </div>
        </Card>
        
        {/* Context-Aware Prompts */}
        {post && (
          <div className="mt-6">
            <ContextPrompts
              context={{
                post,
                postContent: post.content,
                isAmbassadorContent,
                userType: user ? (profile?.user_type || 'player') : undefined
              }}
              onPromptClick={(prompt) => {
                // Could integrate with comment creation or other actions
                console.log('Prompt clicked:', prompt);
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default PostDetail;
