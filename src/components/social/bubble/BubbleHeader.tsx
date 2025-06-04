
import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import { PostActions } from '../PostActions';
import { AmbassadorContentIndicator } from '../AmbassadorContentIndicator';
import { PrivacyIndicator } from '../PrivacyIndicator';
import { formatDistanceToNow } from 'date-fns';

interface BubbleHeaderProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
  onPostUpdated?: () => void;
}

export function BubbleHeader({ post, currentUserId, contentType, onPostUpdated }: BubbleHeaderProps) {
  const getAmbassadorName = () => {
    if (!post.is_ambassador_content) return undefined;
    return post.author?.full_name || 'Rally Ambassador';
  };

  const getContentType = () => {
    // Extract content type from post content or metadata
    const content = post.content.toLowerCase();
    if (content.includes('ugh') || content.includes('struggle') || content.includes('double-fault')) {
      return 'struggle';
    }
    if (content.includes('finally') || content.includes('breakthrough') || content.includes('nailed')) {
      return 'success';
    }
    if (content.includes('tip') || content.includes('pro tip') || content.includes('reminder')) {
      return 'tip';
    }
    if (content.includes('?') || content.includes('poll') || content.includes('what\'s your')) {
      return 'question';
    }
    if (content.includes('remember') || content.includes('keep') || content.includes('you\'re')) {
      return 'encouragement';
    }
    return undefined;
  };

  return (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 ring-2 ring-offset-1 ring-muted">
            <AvatarImage 
              src={post.author?.avatar_url || undefined} 
              alt={post.author?.full_name || 'User'} 
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 font-medium">
              {post.author?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">
                {post.author?.full_name || 'Anonymous User'}
              </span>
              
              <AmbassadorContentIndicator
                isAmbassadorContent={post.is_ambassador_content}
                ambassadorName={getAmbassadorName()}
                contentType={getContentType()}
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <time dateTime={post.created_at}>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </time>
              
              <PrivacyIndicator 
                privacyLevel={post.privacy_level || 'public'} 
                size="sm"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <PostActions 
            post={post} 
            onEdit={onPostUpdated}
            onDelete={onPostUpdated}
          />
        </div>
      </div>
    </CardHeader>
  );
}
