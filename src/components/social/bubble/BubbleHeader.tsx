
import React from 'react';
import { Post } from '@/types/post';
import { CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { PostActions } from '../PostActions';
import { FollowButton } from '../FollowButton';
import { PrivacyIndicator } from '../PrivacyIndicator';

interface BubbleHeaderProps {
  post: Post;
  currentUserId?: string;
  onPostUpdated?: () => void;
}

export function BubbleHeader({ post, currentUserId, onPostUpdated }: BubbleHeaderProps) {
  const isOwnPost = currentUserId === post.user_id;

  return (
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
          {isOwnPost && (
            <PostActions 
              post={post} 
              onEdit={onPostUpdated}
              onDelete={onPostUpdated}
            />
          )}
          {/* Show follow button for other users' posts */}
          {currentUserId && !isOwnPost && (
            <FollowButton userId={post.user_id} />
          )}
        </div>
      </div>
    </CardHeader>
  );
}
