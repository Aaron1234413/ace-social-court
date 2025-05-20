
import { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';

interface MessageThreadProps {
  conversationId: string | null;
}

const MessageThread = ({ conversationId }: MessageThreadProps) => {
  const { user } = useAuth();
  const { messages, isLoading, error } = useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  if (!conversationId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">Select a conversation or search for a user to start chatting</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className={`h-12 w-2/3 rounded-xl ${i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`} />
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading messages: {error.message}
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    );
  }
  
  // Group messages by date
  const groupedMessages: { [date: string]: typeof messages } = {};
  messages.forEach(message => {
    const date = format(new Date(message.created_at), 'MMM d, yyyy');
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, messages]) => (
        <div key={date} className="space-y-4">
          <div className="flex justify-center">
            <span className="text-xs bg-accent/60 text-muted-foreground px-2 py-1 rounded-full">
              {date}
            </span>
          </div>
          
          {messages.map(message => {
            const isCurrentUser = message.sender_id === user?.id;
            
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
                    {user?.user_metadata?.avatar_url && (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt={user?.user_metadata?.full_name || 'User'} 
                        className="h-full w-full object-cover"
                      />
                    )}
                    <AvatarFallback>
                      {user?.user_metadata?.full_name?.charAt(0) || 
                       user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread;
