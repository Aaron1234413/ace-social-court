
import React from 'react';
import { CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import { AmbassadorContentIndicator } from '../AmbassadorContentIndicator';
import { PrivacyIndicator } from '../PrivacyIndicator';
import { PostActions } from '../PostActions';
import { AISuggestionButton } from '../AISuggestionButton';

interface BubbleHeaderProps {
  post: Post;
  currentUserId?: string;
  contentType: ContentType;
  onPostUpdated?: () => void;
  onSuggestionSelect?: (suggestion: string) => void;
}

export function BubbleHeader({ 
  post, 
  currentUserId, 
  contentType, 
  onPostUpdated,
  onSuggestionSelect 
}: BubbleHeaderProps) {
  const isOwnPost = post.user_id === currentUserId;
  const authorName = post.author?.full_name || 'Anonymous';
  const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 ring-2 ring-muted flex-shrink-0">
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback className="text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm md:text-base truncate">
                {authorName}
              </h3>
              
              {post.author?.user_type === 'coach' && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 flex-shrink-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Coach
                </Badge>
              )}
              
              {post.author?.user_type === 'ambassador' && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 flex-shrink-0">
                  <Star className="h-3 w-3 mr-1" />
                  Ambassador
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <time dateTime={post.created_at} className="flex-shrink-0">
                {timeAgo}
              </time>
              <PrivacyIndicator privacy={post.privacy_level} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* AI Suggestion Button */}
          {onSuggestionSelect && (
            <AISuggestionButton 
              post={post}
              onSuggestionSelect={onSuggestionSelect}
            />
          )}
          
          {/* Post Actions Menu */}
          {isOwnPost && (
            <PostActions 
              post={post} 
              onPostUpdated={onPostUpdated}
            />
          )}
        </div>
      </div>
      
      {contentType === 'ambassador' && (
        <AmbassadorContentIndicator className="mt-2" />
      )}
    </CardHeader>
  );
}
