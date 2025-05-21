
import React from 'react';
import { Message } from '@/types/messages';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, Trash2, Smile, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MessageActionsProps {
  message: Message;
  isCurrentUser: boolean;
  onAddReaction: (messageId: string, reactionType: string) => void;
  onRemoveReaction: (messageId: string, reactionType: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isVisible: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isCurrentUser,
  onAddReaction,
  onRemoveReaction,
  onDeleteMessage,
  isVisible
}) => {
  // Show nothing if message is deleted
  if (message.is_deleted) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute -bottom-8 flex items-center space-x-1 transition-opacity",
        isVisible ? "opacity-100" : "opacity-0",
        isCurrentUser ? "right-0" : "left-0"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-primary/10"
        onClick={() => onAddReaction(message.id, 'heart')}
        title="Heart"
      >
        <Heart className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-primary/10"
        onClick={() => onAddReaction(message.id, 'thumbs_up')}
        title="Like"
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-primary/10"
        onClick={() => onAddReaction(message.id, 'laugh')}
        title="Laugh"
      >
        <Smile className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-primary/10"
        onClick={() => onAddReaction(message.id, 'sad')}
        title="Sad"
      >
        <Frown className="h-3 w-3" />
      </Button>
      
      {isCurrentUser && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDeleteMessage(message.id)}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default MessageActions;
