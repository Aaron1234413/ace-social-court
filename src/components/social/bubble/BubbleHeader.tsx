
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Post } from '@/types/post';
import { ContentType } from '../FeedBubble';
import { AmbassadorHeader, AmbassadorBadge } from '../AmbassadorBadge';
import { MoreHorizontal, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  const isAmbassador = contentType === 'ambassador';
  const isPriorityAmbassador = isAmbassador && post.ambassador_priority;
  const authorName = post.author?.full_name || 'Unknown User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="flex items-center justify-between p-4 pb-0">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          {post.author?.avatar_url && (
            <AvatarImage src={post.author.avatar_url} alt={authorName} />
          )}
          <AvatarFallback>
            {authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col">
          {isAmbassador ? (
            <AmbassadorHeader 
              authorName={authorName}
              variant="compact"
              priority={isPriorityAmbassador}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{authorName}</span>
              {contentType === 'fallback' && (
                <AmbassadorBadge variant="compact" className="bg-blue-100 text-blue-800 border-blue-200" />
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
            {post.is_auto_generated && (
              <Badge variant="secondary" className="text-xs">
                Auto-generated
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions menu */}
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
