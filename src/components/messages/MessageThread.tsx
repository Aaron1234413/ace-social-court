
import { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';
import MessageGroup from './MessageGroup';
import { Message } from '@/types/messages';

interface MessageThreadProps {
  conversationId: string | null;
}

const MessageThread = ({ conversationId }: MessageThreadProps) => {
  const { user } = useAuth();
  const { messages, isLoading, error } = useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleMessageClick = (messageId: string) => {
    setSelectedMessage(selectedMessage === messageId ? null : messageId);
  };
  
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
  
  // Group messages by date and then by sender
  const groupedByDate: { [date: string]: Message[] } = {};
  
  messages.forEach(message => {
    const date = format(new Date(message.created_at), 'MMM d, yyyy');
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(message);
  });
  
  // Further group consecutive messages from the same sender
  const groupedMessages: { date: string, messageGroups: Message[][] }[] = [];
  
  Object.entries(groupedByDate).forEach(([date, messagesForDate]) => {
    let currentGroup: Message[] = [];
    let currentSenderId: string | null = null;
    
    messagesForDate.forEach(message => {
      if (currentSenderId !== message.sender_id) {
        if (currentGroup.length > 0) {
          if (!groupedMessages.find(group => group.date === date)) {
            groupedMessages.push({ date, messageGroups: [] });
          }
          const dateGroup = groupedMessages.find(group => group.date === date);
          if (dateGroup) {
            dateGroup.messageGroups.push([...currentGroup]);
          }
        }
        currentGroup = [message];
        currentSenderId = message.sender_id;
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      if (!groupedMessages.find(group => group.date === date)) {
        groupedMessages.push({ date, messageGroups: [] });
      }
      const dateGroup = groupedMessages.find(group => group.date === date);
      if (dateGroup) {
        dateGroup.messageGroups.push(currentGroup);
      }
    }
  });
  
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {groupedMessages.map(({ date, messageGroups }) => (
        <div key={date} className="space-y-3">
          <div className="flex justify-center">
            <span className="text-xs bg-accent/60 text-muted-foreground px-2 py-1 rounded-full">
              {date}
            </span>
          </div>
          
          {messageGroups.map((messageGroup, groupIndex) => (
            <MessageGroup 
              key={`${date}-${groupIndex}`}
              messages={messageGroup} 
              isCurrentUser={user?.id === messageGroup[0].sender_id}
              onMessageClick={handleMessageClick}
              selectedMessage={selectedMessage}
            />
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread;
