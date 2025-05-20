
import React, { useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message, MessageReaction } from '@/components/messages/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/ui/error-alert';
import MessageGroup from './MessageGroup';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  error?: { message: string } | null;
  selectedMessage: string | null;
  handleMessageClick: (messageId: string) => void;
  onAddReaction: (messageId: string, type: MessageReaction['reaction_type']) => void;
  onRemoveReaction: (messageId: string, reactionId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  otherUser?: any; // For typing indicator
  isTyping: boolean;
}

const MessagesList = ({
  messages,
  isLoading,
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
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change or typing status changes
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, isTyping]);
  
  // Helper function to format date for message grouping
  const formatMessageDate = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 py-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex gap-2 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-12 w-[200px] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-4">
        <ErrorAlert
          title="Failed to load messages"
          message={error.message}
          severity="error"
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['messages'] })}
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-tennis-green/10 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64" className="text-tennis-green opacity-60">
              <path fill="currentColor" d="M33.18 3.195a28 28 0 0 0-26 43.98l-4 11 11-4a28 28 0 1 0 19-50.98zm0 52a24 24 0 0 1-13-3.85l-1.67-.99L12 52l1.65-6.5-.99-1.67a24 24 0 1 1 20.52 11.37z"/>
            </svg>
          </div>
          <p className="text-tennis-darkGreen font-medium mb-1">Start the conversation</p>
          <p className="text-sm text-muted-foreground">Send your first message to begin chatting</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const messagesByDate = messages.reduce((groups: Record<string, Message[]>, message) => {
    const date = formatMessageDate(new Date(message.created_at));
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  
  // Further group messages by sender in consecutive sequences
  const groupMessagesBySender = (messages: Message[]) => {
    const groups: { messages: Message[], sender_id: string }[] = [];
    
    messages.forEach((message) => {
      const lastGroup = groups[groups.length - 1];
      
      if (lastGroup && lastGroup.sender_id === message.sender_id) {
        // Add to the existing group if same sender and within 2 minutes
        const lastMessage = lastGroup.messages[lastGroup.messages.length - 1];
        const timeDiff = new Date(message.created_at).getTime() - new Date(lastMessage.created_at).getTime();
        
        if (timeDiff < 2 * 60 * 1000) { // 2 minutes in milliseconds
          lastGroup.messages.push(message);
        } else {
          // Create new group if time difference is too large
          groups.push({
            sender_id: message.sender_id,
            messages: [message]
          });
        }
      } else {
        // Create new group for new sender
        groups.push({
          sender_id: message.sender_id,
          messages: [message]
        });
      }
    });
    
    return groups;
  };

  return (
    <>
      {Object.keys(messagesByDate).map((date) => {
        const messageGroups = groupMessagesBySender(messagesByDate[date]);
        
        return (
          <div key={date} className="space-y-6">
            <div className="flex justify-center my-4">
              <div className="px-3 py-1 bg-tennis-green/10 text-tennis-darkGreen rounded-full text-xs font-medium">
                {date}
              </div>
            </div>
            
            {messageGroups.map((group, groupIndex) => {
              const isCurrentUser = group.sender_id === user?.id;
              
              return (
                <MessageGroup
                  key={`${date}-${groupIndex}`}
                  messages={group.messages}
                  isCurrentUser={isCurrentUser}
                  handleMessageClick={handleMessageClick}
                  selectedMessage={selectedMessage}
                  onAddReaction={onAddReaction}
                  onRemoveReaction={onRemoveReaction}
                  onDeleteMessage={onDeleteMessage}
                />
              );
            })}
          </div>
        );
      })}
      
      {/* Typing indicator */}
      {isTyping && otherUser && (
        <div className="flex justify-start my-2">
          <div className="flex items-start gap-2 max-w-[80%]">
            <Avatar className="h-8 w-8 mt-1 border-2 border-tennis-green/20">
              {otherUser?.avatar_url && (
                <img src={otherUser.avatar_url} alt={otherUser?.username || 'User'} />
              )}
              <AvatarFallback className="bg-tennis-green/10 text-tennis-darkGreen">
                {otherUser?.full_name?.charAt(0) || otherUser?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="px-4 py-3 bg-tennis-green/10 rounded-xl rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-tennis-green animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-tennis-green animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-tennis-green animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </>
  );
};

export default MessagesList;
