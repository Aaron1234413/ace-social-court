
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Message } from '@/types/messages';
import { Smile, MoreVertical, Trash2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface MessageGroupProps {
  messages: Message[];
  isCurrentUser: boolean;
  handleMessageClick?: (messageId: string) => void;
  selectedMessage?: string | null;
  onAddReaction?: (messageId: string, type: "like" | "heart" | "laugh" | "sad" | "thumbs_up") => void;
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
    <div className="space-y-1 mb-3 animate-fade-in">
      {messages.map((message, index) => {
        const isFirstInGroup = index === 0;
        const showAvatar = isFirstInGroup;
        
        return (
          <div 
            key={message.id} 
            className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
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
            
            <div className="relative">
              <div 
                className={`px-4 py-2 rounded-xl max-w-[280px] ${
                  isCurrentUser 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-accent rounded-tl-none'
                } ${selectedMessage === message.id ? 'ring-2 ring-primary' : ''}`}
              >
                <p className="break-words">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {format(new Date(message.created_at), 'h:mm a')}
                </p>
              </div>
              
              {/* Message Actions - Only show on hover or when selected */}
              <div className={`absolute ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <div className="flex gap-1 items-center">
                  {onAddReaction && (
                    <button 
                      className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddReaction(message.id, "like");
                      }}
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                  )}
                  
                  {isCurrentUser && onDeleteMessage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMessage(message.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
            
            {isCurrentUser && showAvatar && (
              <Avatar className="h-8 w-8 mt-1 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary-foreground">
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
