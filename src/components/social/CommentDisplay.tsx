
import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { formatTextWithMentions } from '@/utils/mentionUtils';

interface CommentDisplayProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      username?: string;
      full_name?: string;
      avatar_url?: string;
    };
  };
}

const CommentDisplay = ({ comment }: CommentDisplayProps) => {
  const formattedContent = formatTextWithMentions(comment.content);
  
  return (
    <div className="flex gap-3 py-2">
      <Link to={`/profile/${comment.user.id}`}>
        <Avatar className="h-8 w-8">
          {comment.user.avatar_url && (
            <img src={comment.user.avatar_url} alt={comment.user.username || 'User'} />
          )}
          <AvatarFallback>
            {(comment.user.username?.charAt(0) || 
              comment.user.full_name?.charAt(0) || 
              'U').toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex-1">
        <div className="bg-accent rounded-xl px-3 py-2">
          <div className="flex items-center gap-1">
            <Link 
              to={`/profile/${comment.user.id}`}
              className="font-medium hover:underline"
            >
              {comment.user.username || comment.user.full_name || 'User'}
            </Link>
            <span className="text-xs text-muted-foreground">
              • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="mt-1">
            {formattedContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentDisplay;
