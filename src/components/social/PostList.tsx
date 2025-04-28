
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import LikeButton from '@/components/social/LikeButton';
import CommentButton from '@/components/social/CommentButton';
import FollowButton from '@/components/social/FollowButton';
import { Post } from '@/types/post';

interface PostListProps {
  posts: Post[];
  currentUserId?: string;
  handleShare: (postId: string) => void;
  isLoading: boolean;
}

const PostList = ({ posts, currentUserId, handleShare, isLoading }: PostListProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2.5"></div>
          <div className="h-10 bg-slate-200 rounded w-full mb-2.5"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
        <p className="mt-4 text-muted-foreground">Loading posts...</p>
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
        <Card key={post.id} className="overflow-hidden">
          <CardHeader className="pb-2 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {post.author?.full_name?.charAt(0) || '?'}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-sm md:text-base">{post.author?.full_name || 'Anonymous'}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {post.author?.user_type === 'coach' ? 'Coach' : 'Player'} · {
                      new Date(post.created_at).toLocaleDateString()
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
            <LikeButton postId={post.id} />
            <CommentButton postId={post.id} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleShare(post.id)}
              className="flex items-center gap-1 text-xs md:text-sm"
              aria-label="Share post"
            >
              <Share className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Share</span>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PostList;
