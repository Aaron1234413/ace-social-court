
import { Fragment } from 'react';
import { Message } from '@/types/messages';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageGroup from './MessageGroup';

interface MessagesListProps {
  messages: Message[];
  isLoading?: boolean;
  error?: { message: string } | null;
  selectedMessage?: string | null;
  handleMessageClick?: (messageId: string) => void;
  onAddReaction?: (messageId: string, reaction: string) => void;
  onRemoveReaction?: (messageId: string, reaction: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  otherUser?: any;
  isTyping?: boolean;
}

const MessagesList = ({
  messages,
  isLoading = false,
  error,
  selectedMessage,
  handleMessageClick,
  onAddReaction,
  onRemoveReaction,
  onDeleteMessage,
  otherUser,
  isTyping
}: MessagesListProps) => {
  const { user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="bg-destructive/10 text-destructive p-3 rounded-md">
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
        <p>No messages yet.</p>
        <p className="text-sm mt-1">Send a message to start the conversation!</p>
      </div>
    );
  }
  
  // Group messages by day
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach((message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  // Group consecutive messages by same sender
  const groupConsecutiveMessagesBySender = (messages: Message[]): Message[][] => {
    return messages.reduce((groups: Message[][], message: Message) => {
      const lastGroup = groups[groups.length - 1];
      
      if (lastGroup && lastGroup[0].sender_id === message.sender_id) {
        lastGroup.push(message);
      } else {
        groups.push([message]);
      }
      
      return groups;
    }, []);
  };
  
  return (
    <div className="flex flex-col space-y-6">
      {Object.entries(groupedMessages).map(([date, messagesForDate]) => {
        const messageGroups = groupConsecutiveMessagesBySender(messagesForDate);
        
        return (
          <Fragment key={date}>
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative bg-background px-2 text-xs text-muted-foreground">
                {date === new Date().toLocaleDateString() 
                  ? "Today" 
                  : date === new Date(Date.now() - 86400000).toLocaleDateString()
                    ? "Yesterday"
                    : date}
              </div>
            </div>
            
            {messageGroups.map((group, groupIndex) => (
              <MessageGroup 
                key={`${date}-group-${groupIndex}`}
                messages={group}
                isCurrentUser={group[0].sender_id === user?.id}
                selectedMessageId={selectedMessage}
                onMessageClick={handleMessageClick}
                onAddReaction={onAddReaction}
                onRemoveReaction={onRemoveReaction}
                onDeleteMessage={onDeleteMessage}
              />
            ))}
          </Fragment>
        );
      })}
      
      {isTyping && (
        <div className="flex items-start gap-2 px-4">
          <Avatar className="h-8 w-8">
            {otherUser?.avatar_url && <AvatarImage src={otherUser.avatar_url} alt={otherUser.username || 'User'} />}
            <AvatarFallback>{otherUser?.full_name?.[0] || otherUser?.username?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="bg-muted px-4 py-2 rounded-lg">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="h-2 w-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesList;
