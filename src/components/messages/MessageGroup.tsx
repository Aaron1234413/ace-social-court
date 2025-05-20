
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Message } from '@/types/messages';

interface MessageGroupProps {
  date: string;
  messages: Message[];
  currentUser: any;
}

const MessageGroup = ({ date, messages, currentUser }: MessageGroupProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <span className="text-xs bg-accent/60 text-muted-foreground px-2 py-1 rounded-full">
          {date}
        </span>
      </div>
      
      {messages.map(message => {
        const isCurrentUser = message.sender_id === currentUser?.id;
        
        return (
          <div 
            key={message.id} 
            className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            {!isCurrentUser && (
              <Avatar className="h-8 w-8">
                {message.sender?.avatar_url && (
                  <img 
                    src={message.sender.avatar_url} 
                    alt={message.sender?.username || 'User'} 
                    className="h-full w-full object-cover"
                  />
                )}
                <AvatarFallback>
                  {message.sender?.full_name?.charAt(0) || 
                   message.sender?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div 
              className={`px-4 py-2 rounded-xl max-w-[80%] ${
                isCurrentUser 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-accent rounded-tl-none'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {format(new Date(message.created_at), 'h:mm a')}
              </p>
            </div>
            
            {isCurrentUser && (
              <Avatar className="h-8 w-8">
                {currentUser?.user_metadata?.avatar_url && (
                  <img 
                    src={currentUser.user_metadata.avatar_url} 
                    alt={currentUser?.user_metadata?.full_name || 'User'} 
                    className="h-full w-full object-cover"
                  />
                )}
                <AvatarFallback>
                  {currentUser?.user_metadata?.full_name?.charAt(0) || 
                   currentUser?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageGroup;
