
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Message } from '@/components/messages/types';

interface MessageGroupProps {
  messages: Message[];
  isCurrentUser: boolean;
  handleMessageClick?: (messageId: string) => void;
  selectedMessage?: string | null;
  onAddReaction?: (messageId: string, type: string) => void;
  onRemoveReaction?: (messageId: string, reactionId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

const MessageGroup = ({ 
  messages, 
  isCurrentUser,
  handleMessageClick,
  selectedMessage,
  onAddReaction,
  onRemoveReaction,
  onDeleteMessage
}: MessageGroupProps) => {
  if (!messages || messages.length === 0) return null;
  
  const firstMessage = messages[0];
  const sender = firstMessage.sender;
  
  return (
    <div className="space-y-1 mb-3">
      {messages.map((message, index) => {
        const isFirstInGroup = index === 0;
        const showAvatar = isFirstInGroup;
        
        return (
          <div 
            key={message.id} 
            className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            onClick={() => handleMessageClick && handleMessageClick(message.id)}
          >
            {!isCurrentUser && showAvatar && (
              <Avatar className="h-8 w-8 mt-1 border-2 border-tennis-green/20">
                {sender?.avatar_url && (
                  <img 
                    src={sender.avatar_url} 
                    alt={sender?.username || 'User'} 
                    className="h-full w-full object-cover"
                  />
                )}
                <AvatarFallback className="bg-tennis-green/10 text-tennis-darkGreen">
                  {sender?.full_name?.charAt(0) || 
                   sender?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            
            {!isCurrentUser && !showAvatar && <div className="w-8" />}
            
            <div 
              className={`px-4 py-2 rounded-xl max-w-[80%] ${
                isCurrentUser 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-accent rounded-tl-none'
              } ${selectedMessage === message.id ? 'ring-2 ring-primary' : ''}`}
            >
              <p>{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {format(new Date(message.created_at), 'h:mm a')}
              </p>
            </div>
            
            {isCurrentUser && showAvatar && (
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback>
                  U
                </AvatarFallback>
              </Avatar>
            )}
            
            {isCurrentUser && !showAvatar && <div className="w-8" />}
          </div>
        );
      })}
    </div>
  );
};

export default MessageGroup;
