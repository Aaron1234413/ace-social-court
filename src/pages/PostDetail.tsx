
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

const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:user_id (
            id,
            full_name,
            user_type,
            avatar_url
          ),
          likes:likes (count),
          comments:comments (count)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Post;
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
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

          {post.content && (
            <p className="text-base break-words mb-4">{post.content}</p>
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
