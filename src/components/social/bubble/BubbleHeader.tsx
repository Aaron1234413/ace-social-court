
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import { PostActions } from '../PostActions';
import FollowButton from '../FollowButton';
import { PrivacyIndicator } from '../PrivacyIndicator';
import { useAuth } from '@/components/AuthProvider';
import { Star, Crown, Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BubbleHeaderProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
  onPostUpdated?: () => void;
}

export function BubbleHeader({ post, currentUserId, contentType, onPostUpdated }: BubbleHeaderProps) {
  const { profile } = useAuth();
  const isCoach = profile?.user_type === 'coach';
  const isOwnPost = currentUserId === post.user_id;
  const isAmbassadorContent = contentType === 'ambassador';

  return (
    <div className="bubble-header">
      <Link to={`/profile/${post.user_id}`} className="hover:opacity-80 transition-opacity">
        <Avatar className="h-10 w-10 border-2 border-background">
          {post.author?.avatar_url ? (
            <AvatarImage 
              src={post.author.avatar_url} 
              alt={post.author?.full_name || 'User'} 
            />
          ) : (
            <AvatarFallback className={cn(
              "font-semibold",
              isAmbassadorContent
                ? "bg-gradient-to-br from-purple-100 to-purple-300 text-purple-800"
                : post.author?.user_type === 'coach' 
                ? "bg-gradient-to-br from-purple-100 to-purple-300 text-purple-800" 
                : "bg-gradient-to-br from-blue-100 to-blue-300 text-blue-800"
            )}>
              {post.author?.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          )}
        </Avatar>
      </Link>
      
      <Link 
        to={`/profile/${post.user_id}`} 
        className="username hover:underline transition-colors"
      >
        {post.author?.full_name || 'Anonymous'}
      </Link>
      
      {isAmbassadorContent && (
        <Badge variant="secondary" className="role-badge bg-purple-100 text-purple-800 border-purple-200">
          <Crown className="h-3 w-3 mr-1" />
          Rally Ambassador
        </Badge>
      )}
      
      <span className="timestamp">
        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
      </span>
      
      {post.privacy_level && post.privacy_level !== 'public' && (
        <Lock className="privacy-lock h-4 w-4 text-gray-400" />
      )}
      
      {/* Coach controls */}
      {isCoach && !isOwnPost && !isAmbassadorContent && (
        <Star className="trophy-icon h-4 w-4 text-yellow-600 cursor-pointer hover:text-yellow-700" />
      )}
      
      {/* Follow button for non-own, non-ambassador posts */}
      {currentUserId && !isOwnPost && !isAmbassadorContent && (
        <FollowButton userId={post.user_id} />
      )}
      
      {/* Post actions menu */}
      {isOwnPost && (
        <div className="menu-dot">
          <PostActions 
            post={post} 
            onEdit={onPostUpdated}
            onDelete={onPostUpdated}
          />
        </div>
      )}
    </div>
  );
}
