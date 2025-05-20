
import { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';
import MessageGroup from './MessageGroup';

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
      {Object.entries(groupedMessages).map(([date, messagesGroup]) => (
        <MessageGroup 
          key={date} 
          date={date} 
          messages={messagesGroup} 
          currentUser={user}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread;
