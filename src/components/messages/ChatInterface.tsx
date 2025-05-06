
import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/components/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Message } from '@/components/messages/types';
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from 'date-fns';
import { Send, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatInterfaceProps {
  onError?: (error: string) => void;
}

const ChatInterface = ({ onError }: ChatInterfaceProps) => {
  const { chatId } = useParams<{ chatId: string }>();
  const otherUserId = chatId; // Use the chatId directly from params
  
  console.log("ChatInterface - using otherUserId:", otherUserId);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if we have a valid otherUserId
  const validConversation = !!otherUserId && otherUserId !== 'undefined';
  
  const { 
    messages, 
    isLoadingMessages,
    error: messagesError,
    newMessage, 
    setNewMessage, 
    sendMessage,
    isSending
  } = useMessages(validConversation ? otherUserId : undefined);
  
  // Handle any errors
  useEffect(() => {
    if (messagesError && onError) {
      onError(messagesError.message);
    }
  }, [messagesError, onError]);

  // Focus input field when component mounts or otherUserId changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    console.log("Chat interface loaded for user:", otherUserId);
  }, [otherUserId]);

  // Display warning if no valid otherUserId
  useEffect(() => {
    if (!validConversation) {
      console.warn("No valid conversation ID found in URL parameters");
    }
  }, [validConversation]);

  const { data: otherUser, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: async () => {
      if (!otherUserId || otherUserId === 'undefined') {
        throw new Error("No valid user ID provided");
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherUserId)
        .single();
      
      if (error) {
        console.error("Error fetching user:", error);
        throw error;
      }
      return data;
    },
    enabled: validConversation
  });

  // Handle user data error
  useEffect(() => {
    if (userError && onError) {
      onError("Failed to load user information: " + (userError instanceof Error ? userError.message : String(userError)));
    }
  }, [userError, onError]);

  // Simulate typing indicator effect
  const simulateTypingIndicator = useCallback(() => {
    // Only show typing indicator occasionally to make it feel more natural
    if (Math.random() > 0.7 && messages.length > 0) {
      setIsTyping(true);
      
      // Clear previous timeout if exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set random duration for typing indicator (between 2-5 seconds)
      const duration = Math.floor(Math.random() * 3000) + 2000;
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, duration);
    }
  }, [messages.length]);

  // Subscribe to realtime updates for new messages
  useEffect(() => {
    if (!validConversation || !user) return;
    
    console.log("Setting up realtime subscription for messages");
    
    const channel = supabase
      .channel('direct_messages_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        console.log("Realtime message received:", payload);
        queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        // Show typing indicator before new message comes in
        simulateTypingIndicator();
      })
      .subscribe((status) => {
        console.log("Channel status:", status);
      });
    
    return () => {
      console.log("Removing realtime subscription");
      supabase.removeChannel(channel);
      
      // Clear typing timeout if component unmounts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [otherUserId, user, queryClient, simulateTypingIndicator]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, isTyping]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validConversation) {
      if (onError) onError("Cannot send message: Invalid conversation");
      return;
    }
    
    if (newMessage.trim()) {
      try {
        sendMessage();
      } catch (error) {
        console.error("Error sending message:", error);
        if (error instanceof Error && onError) {
          onError("Failed to send message: " + error.message);
        }
      }
    }
  }, [newMessage, sendMessage, onError, validConversation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() && validConversation) {
        sendMessage();
      }
    }
  }, [newMessage, sendMessage, validConversation]);
  
  const handleMessageClick = useCallback((messageId: string) => {
    setSelectedMessage(messageId === selectedMessage ? null : messageId);
  }, [selectedMessage]);

  // Helper to navigate back to messages list on mobile
  const handleBackClick = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  // Helper function to format date for message grouping
  const formatMessageDate = useCallback((date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  }, []);

  // Display error if no valid conversation
  if (!validConversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <ErrorAlert
          title="Invalid conversation"
          message="No valid conversation ID was found"
          severity="warning"
          onRetry={() => navigate('/messages')}
        />
      </div>
    );
  }

  const renderMessages = () => {
    if (isLoadingMessages) {
      return (
        <div className="flex flex-col space-y-4 py-4">
          {[...Array(5)].map((_, i) => (
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

    if (messagesError) {
      return (
        <div className="py-4 px-4">
          <ErrorAlert
            title="Failed to load messages"
            message={messagesError.message}
            severity="error"
            onRetry={() => queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] })}
          />
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          No messages yet. Start a conversation!
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
                <div className="px-3 py-1 bg-accent rounded-full text-xs">
                  {date}
                </div>
              </div>
              
              {messageGroups.map((group, groupIndex) => {
                const isCurrentUser = group.sender_id === user?.id;
                
                return (
                  <div 
                    key={`${date}-${groupIndex}`} 
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div 
                      className={`flex items-start gap-2 max-w-[80%] ${
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Only show avatar once per group */}
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        {group.messages[0].sender?.avatar_url && (
                          <img 
                            src={group.messages[0].sender.avatar_url} 
                            alt={group.messages[0].sender?.username || 'User'} 
                          />
                        )}
                        <AvatarFallback>
                          {group.sender_id === user?.id 
                            ? user.email?.charAt(0).toUpperCase() || 'Y'
                            : group.messages[0].sender?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        {group.messages.map((message, msgIndex) => {
                          const isFirstInGroup = msgIndex === 0;
                          const isLastInGroup = msgIndex === group.messages.length - 1;
                          
                          // Determine border radius based on position in group
                          let borderRadiusClass = 'rounded-xl';
                          if (isCurrentUser) {
                            if (group.messages.length > 1) {
                              if (isFirstInGroup) borderRadiusClass = 'rounded-xl rounded-br-sm';
                              else if (isLastInGroup) borderRadiusClass = 'rounded-xl rounded-tr-sm';
                              else borderRadiusClass = 'rounded-xl rounded-r-sm';
                            } else {
                              borderRadiusClass = 'rounded-xl rounded-br-none';
                            }
                          } else {
                            if (group.messages.length > 1) {
                              if (isFirstInGroup) borderRadiusClass = 'rounded-xl rounded-bl-sm';
                              else if (isLastInGroup) borderRadiusClass = 'rounded-xl rounded-tl-sm';
                              else borderRadiusClass = 'rounded-xl rounded-l-sm';
                            } else {
                              borderRadiusClass = 'rounded-xl rounded-bl-none';
                            }
                          }
                          
                          return (
                            <div key={message.id} className="space-y-1">
                              <div 
                                className={`px-4 py-2 ${borderRadiusClass} ${
                                  isCurrentUser 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-accent'
                                } ${selectedMessage === message.id ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                onClick={() => handleMessageClick(message.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    handleMessageClick(message.id);
                                  }
                                }}
                              >
                                <p>{message.content}</p>
                              </div>
                              
                              {/* Only show time for last message in a group */}
                              {isLastInGroup && (
                                <div className={`flex items-center text-xs text-muted-foreground ${isCurrentUser ? 'justify-end' : 'justify-start'} px-1`}>
                                  <span>{format(new Date(message.created_at), 'h:mm a')}</span>
                                  {isCurrentUser && message.read && (
                                    <Check className="h-3 w-3 ml-1 text-primary" />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start my-2">
            <div className="flex items-start gap-2 max-w-[80%]">
              <Avatar className="h-8 w-8 mt-1">
                {otherUser?.avatar_url && (
                  <img src={otherUser.avatar_url} alt={otherUser?.username || 'User'} />
                )}
                <AvatarFallback>
                  {otherUser?.full_name?.charAt(0) || otherUser?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="px-4 py-2 bg-accent rounded-xl rounded-bl-none">
                <div className="flex items-center h-6 space-x-1">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center bg-background sticky top-0 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        
        {isLoadingUser ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-[100px]" />
          </div>
        ) : userError ? (
          <div className="text-destructive text-sm">Failed to load user</div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {otherUser?.avatar_url && (
                <img src={otherUser.avatar_url} alt={otherUser?.username || 'User'} />
              )}
              <AvatarFallback>
                {otherUser?.full_name?.charAt(0) || 
                 otherUser?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {otherUser?.full_name || otherUser?.username || 'User'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderMessages()}
      </div>
      
      {/* Message Input */}
      <div className="border-t p-4 bg-background sticky bottom-0 z-10">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1"
            ref={inputRef}
            aria-label="Message input"
          />
          <Button 
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
            className="rounded-full h-10 w-10"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
