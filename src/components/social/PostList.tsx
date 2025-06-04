import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import LikeButton from '@/components/social/LikeButton';
import CommentButton from '@/components/social/CommentButton';
import ShareButton from '@/components/social/ShareButton';
import FollowButton from '@/components/social/FollowButton';
import { Post } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loading } from '@/components/ui/loading';
import { PostActions } from './PostActions';
import { PrivacyIndicator } from './PrivacyIndicator';

interface PostListProps {
  posts: Post[];
  currentUserId?: string;
  handleShare?: (postId: string) => void;
  isLoading: boolean;
  onPostUpdated?: () => void;
}

const PostList = ({ posts, currentUserId, isLoading, onPostUpdated }: PostListProps) => {
  if (isLoading) {
    return <Loading variant="skeleton" count={3} text="Loading posts..." />;
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-8 text-center border border-muted shadow-inner">
        <div className="max-w-md mx-auto">
          <div className="bg-muted/50 p-4 rounded-full inline-block mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No feed items yet</h3>
          <p className="text-sm md:text-base text-muted-foreground">Start connecting with other players or join a group to see content in your feed!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {posts.map((post, index) => (
        <Card 
          key={post.id} 
          className="overflow-hidden hover:shadow-md transition-all duration-300 w-full border-muted/70 animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="pb-2 p-3 md:p-6 bg-gradient-to-r from-card to-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link to={`/profile/${post.user_id}`} className="hover:opacity-80 transition-opacity group">
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-background group-hover:border-primary/20 transition-colors">
                    {post.author?.avatar_url ? (
                      <AvatarImage 
                        src={post.author.avatar_url} 
                        alt={post.author?.full_name || 'User'} 
                      />
                    ) : (
                      <AvatarFallback className={post.author?.user_type === 'coach' 
                        ? "bg-gradient-to-br from-purple-100 to-purple-300 text-purple-800 font-semibold" 
                        : "bg-gradient-to-br from-blue-100 to-blue-300 text-blue-800 font-semibold"
                      }>
                        {post.author?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Link>
                <div className="ml-3 max-w-[calc(100%-48px)]">
                  <Link 
                    to={`/profile/${post.user_id}`} 
                    className="font-semibold text-sm md:text-base hover:underline truncate block group"
                  >
                    <span className="group-hover:text-primary transition-colors">{post.author?.full_name || 'Anonymous'}</span>
                  </Link>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground truncate">
                    <span className={post.author?.user_type === 'coach' ? "text-tennis-accent font-medium" : ""}>
                      {post.author?.user_type === 'coach' ? 'Coach' : 'Player'}
                    </span> 
                    <span>·</span> 
                    <span>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    {post.privacy_level && (
                      <>
                        <span>·</span>
                        <PrivacyIndicator privacyLevel={post.privacy_level} />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Show post actions if the post belongs to the current user */}
                {currentUserId === post.user_id && (
                  <PostActions 
                    post={post} 
                    onEdit={onPostUpdated}
                    onDelete={onPostUpdated}
                  />
                )}
                {/* Show follow button for other users' posts */}
                {currentUserId && currentUserId !== post.user_id && (
                  <FollowButton userId={post.user_id} />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {post.content && (
              <p className="text-sm md:text-base break-words mb-4">{post.content}</p>
            )}

            {post.media_url && (
              <div className="rounded-lg overflow-hidden mt-2 border border-muted/50 w-full shadow-sm hover:shadow-md transition-shadow">
                {post.media_type === 'image' ? (
                  <img 
                    src={post.media_url} 
                    alt="Post media" 
                    className="w-full object-contain max-h-80"
                    style={{ maxWidth: '100%' }}
                  />
                ) : post.media_type === 'video' ? (
                  <video 
                    src={post.media_url} 
                    controls 
                    className="w-full max-h-80"
                    style={{ maxWidth: '100%' }}
                  />
                ) : null}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t p-2 md:p-4 flex justify-between bg-muted/10">
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
