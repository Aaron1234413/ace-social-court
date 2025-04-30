
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import LikeButton from '@/components/social/LikeButton';
import CommentButton from '@/components/social/CommentButton';
import ShareButton from '@/components/social/ShareButton';
import FollowButton from '@/components/social/FollowButton';
import { Post } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PostListProps {
  posts: Post[];
  currentUserId?: string;
  handleShare?: (postId: string) => void;
  isLoading: boolean;
}

const PostList = ({ posts, currentUserId, isLoading }: PostListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="overflow-hidden animate-pulse">
            <CardHeader className="pb-2 p-4 md:p-6">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="ml-3">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded mt-2"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-40 bg-gray-200 rounded w-full mt-4"></div>
            </CardContent>
            <CardFooter className="border-t p-2 md:p-4 flex justify-between">
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-sm md:text-base">No feed items yet. Start connecting with other players!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {posts.map(post => (
        <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link to={`/profile/${post.user_id}`} className="hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {post.author?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="ml-3">
                  <Link 
                    to={`/profile/${post.user_id}`} 
                    className="font-semibold text-sm md:text-base hover:underline"
                  >
                    {post.author?.full_name || 'Anonymous'}
                  </Link>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {post.author?.user_type === 'coach' ? 'Coach' : 'Player'} · {
                      formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                    }
                  </p>
                </div>
              </div>
              {currentUserId && currentUserId !== post.user_id && (
                <FollowButton userId={post.user_id} />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {post.content && (
              <p className="text-sm md:text-base break-words mb-4">{post.content}</p>
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
          </CardContent>
          <CardFooter className="border-t p-2 md:p-4 flex justify-between">
            <LikeButton postId={post.id} postUserId={post.user_id} postContent={post.content} />
            <CommentButton postId={post.id} postUserId={post.user_id} />
            <ShareButton postId={post.id} postContent={post.content} />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PostList;
