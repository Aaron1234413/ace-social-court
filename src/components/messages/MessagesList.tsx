
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/messages';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import MessageActions from './MessageActions';
import MessageMedia from './MessageMedia';

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  error?: { message: string } | null;
  selectedMessage: string | null;
  handleMessageClick: (messageId: string) => void;
  onAddReaction?: (messageId: string, reactionType: string) => void;
  onRemoveReaction?: (messageId: string, reactionType: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  otherUser?: any;
  isTyping?: boolean;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  isLoading,
  error,
  selectedMessage,
  handleMessageClick,
  onAddReaction,
  onRemoveReaction,
  onDeleteMessage,
  otherUser,
  isTyping = false
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground mt-2">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground/70"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <p className="text-center text-muted-foreground">
          No messages yet. Start the conversation!
        </p>
      </div>
    );
  }

  let lastSenderId: string | null = null;
  let lastDate: string | null = null;

  return (
    <div className="flex flex-col space-y-4">
      {messages.map((message, index) => {
        const isCurrentUser = user && message.sender_id === user.id;
        const showSender = message.sender_id !== lastSenderId;
        const messageDate = new Date(message.created_at).toDateString();
        const showDateDivider = lastDate !== messageDate;
        const isIcebreaker = index === 0 && messages.length === 1;
        
        // Update for next iteration
        lastSenderId = message.sender_id;
        lastDate = messageDate;
        
        return (
          <React.Fragment key={message.id}>
            {showDateDivider && (
              <div className="flex items-center justify-center my-4">
                <div className="bg-muted/30 rounded-full px-3 py-1 text-xs text-muted-foreground">
                  {format(new Date(message.created_at), 'MMMM d, yyyy')}
                </div>
              </div>
            )}
            
            <div 
              className={cn(
                "group flex w-full",
                isCurrentUser ? "justify-end" : "justify-start",
                showSender ? "mt-4" : "mt-1",
                isIcebreaker && "animate-fade-in"
              )}
            >
              {!isCurrentUser && showSender && (
                <div className="mr-2 mt-1">
                  <Avatar className="h-6 w-6">
                    {message.sender?.avatar_url ? (
                      <AvatarImage src={message.sender.avatar_url} />
                    ) : (
                      <AvatarFallback>
                        {message.sender?.username?.charAt(0) || 
                         message.sender?.full_name?.charAt(0) || 
                         '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              )}
              
              <div
                className={cn(
                  "relative max-w-[80%]",
                  isCurrentUser ? "order-1" : "order-2"
                )}
              >
                {showSender && !isCurrentUser && message.sender && (
                  <div className="ml-1 mb-1 text-xs text-muted-foreground">
                    {message.sender.full_name || message.sender.username || 'Unknown'}
                  </div>
                )}
                
                <div 
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm relative break-words",
                    isCurrentUser 
                      ? "bg-primary text-primary-foreground rounded-br-none" 
                      : "bg-accent text-accent-foreground rounded-bl-none",
                    selectedMessage === message.id && "ring-2 ring-ring",
                    isIcebreaker && "border-2 border-primary/20" // Highlight icebreakers
                  )}
                  onClick={() => handleMessageClick(message.id)}
                >
                  {message.is_deleted ? (
                    <span className="italic text-muted-foreground">This message was deleted</span>
                  ) : (
                    <>
                      {message.content}
                      {message.media_url && (
                        <div className="mt-2">
                          <MessageMedia 
                            url={message.media_url} 
                            type={message.media_type || 'image'} 
                          />
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-[0.65rem] opacity-70">
                      {format(new Date(message.created_at), 'h:mm a')}
                    </span>
                    
                    {/* Enhanced read receipt indicator */}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground flex items-center" title={message.read ? "Read" : "Delivered"}>
                        {message.read ? (
                          <CheckCheck className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Check className="h-3 w-3 opacity-70" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                {onAddReaction && onRemoveReaction && onDeleteMessage && (
                  <MessageActions
                    message={message}
                    isCurrentUser={isCurrentUser}
                    onAddReaction={onAddReaction}
                    onRemoveReaction={onRemoveReaction}
                    onDeleteMessage={onDeleteMessage}
                    isVisible={selectedMessage === message.id}
                  />
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      
      {isTyping && (
        <div className="flex items-start ml-2">
          <div className="mr-2">
            <Avatar className="h-6 w-6">
              {otherUser?.avatar_url ? (
                <AvatarImage src={otherUser.avatar_url} />
              ) : (
                <AvatarFallback>
                  {otherUser?.username?.charAt(0) || 
                   otherUser?.full_name?.charAt(0) || 
                   '?'}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="bg-accent rounded-lg p-3 inline-flex">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;
