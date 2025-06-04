import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const { data: post, isLoading, error, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`*`)
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      
      if (postData) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('full_name, user_type, avatar_url')
          .eq('id', postData.user_id)
          .single();
          
        const { data: likesCount } = await supabase
          .rpc('get_likes_count', { post_id: postData.id });
          
        const { data: commentsCount } = await supabase
          .rpc('get_comments_count', { post_id: postData.id });
        
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
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Card className="overflow-hidden animate-pulse p-4">
          <div className="flex items-center mb-3">
            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            <div className="ml-3">
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
              <div className="h-2 w-24 bg-gray-200 rounded mt-1"></div>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded w-full mt-3"></div>
        </Card>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/404" />;
  }
  
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
      
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Card className="overflow-hidden border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {post.author?.full_name?.charAt(0) || '?'}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-sm">{post.author?.full_name || 'Anonymous'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {post.author?.user_type === 'coach' ? 'Coach' : 'Player'} · {
                      formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                    }
                  </p>
                </div>
              </div>
              
              {user && user.id === post.user_id && (
                <PostActions 
                  post={post} 
                  onEdit={() => refetch()} 
                  onDelete={handlePostDelete}
                />
              )}
            </div>

            {post.content && (
              <PostContent content={post.content} className="text-sm break-words mb-3" />
            )}

            {post.media_url && (
              <div className="rounded-lg overflow-hidden mt-2 border border-gray-100">
                {post.media_type === 'image' ? (
                  <img 
                    src={post.media_url} 
                    alt="Post media" 
                    className="w-full object-contain max-h-80"
                  />
                ) : post.media_type === 'video' ? (
                  <video 
                    src={post.media_url} 
                    controls 
                    className="w-full max-h-80"
                  />
                ) : null}
              </div>
            )}

            {/* Unified Engagement Section */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                {/* Reaction Bar - Compact inline version */}
                <div className="flex items-center gap-2">
                  <ReactionBar
                    postId={post.id}
                    postUserId={post.user_id}
                    postContent={post.content}
                    privacyLevel={post.privacy_level}
                    isAmbassadorContent={isAmbassadorContent}
                    authorUserType={post.author?.user_type || undefined}
                    compact={true}
                  />
                </div>
                
                {/* Traditional Actions */}
                {user && (
                  <div className="flex items-center gap-1">
                    <LikeButton 
                      postId={post.id} 
                      postUserId={post.user_id} 
                      postContent={post.content}
                      size="sm"
                      variant="ghost"
                    />
                    <CommentButton 
                      postId={post.id} 
                      postUserId={post.user_id}
                      size="sm"
                      variant="ghost"
                    />
                    <ShareButton 
                      postId={post.id} 
                      postContent={post.content}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Context-Aware Prompts - Separate card, more compact */}
        {post && (
          <Card className="mt-3 overflow-hidden border-gray-200">
            <div className="p-3">
              <ContextPrompts
                context={{
                  post,
                  postContent: post.content,
                  isAmbassadorContent,
                  userType: user ? (profile?.user_type || 'player') : undefined
                }}
                onPromptClick={(prompt) => {
                  console.log('Prompt clicked:', prompt);
                }}
                compact={true}
              />
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default PostDetail;
