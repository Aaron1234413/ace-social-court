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
import { formatDistanceToNow } from 'date-fns';
import { Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const ChatInterface = () => {
  const { id: otherUserId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    messages, 
    isLoadingMessages,
    newMessage, 
    setNewMessage, 
    sendMessage,
    isSending
  } = useMessages(otherUserId);
  
  // Focus input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [otherUserId]);

  const { data: otherUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: async () => {
      if (!otherUserId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherUserId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!otherUserId
  });

  // Subscribe to realtime updates for new messages
  useEffect(() => {
    if (!otherUserId || !user) return;
    
    console.log("Setting up realtime subscription for messages");
    
    const channel = supabase
      .channel('direct_messages_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        console.log("Realtime message received, invalidating queries");
        queryClient.invalidateQueries({ queryKey: ['messages', otherUserId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();
    
    console.log("Realtime subscription status:", channel.state);
    
    return () => {
      console.log("Realtime subscription status:", channel.state);
      supabase.removeChannel(channel);
    };
  }, [otherUserId, user, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage();
      toast.success("Message sent successfully");
    }
  }, [newMessage, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        sendMessage();
      }
    }
  }, [newMessage, sendMessage]);
  
  const handleMessageClick = useCallback((messageId: string) => {
    setSelectedMessage(messageId === selectedMessage ? null : messageId);
    console.log("Message clicked:", messageId);
  }, [selectedMessage]);

  // Helper to navigate back to messages list on mobile
  const handleBackClick = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

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

    if (messages.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          No messages yet. Start a conversation!
        </div>
      );
    }

    // Group messages by date
    const messagesByDate = messages.reduce((groups: Record<string, Message[]>, message) => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});

    return (
      <>
        {Object.keys(messagesByDate).map((date) => (
          <div key={date} className="space-y-4">
            <div className="flex justify-center my-2">
              <div className="px-3 py-1 bg-accent rounded-full text-xs">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
            
            {messagesByDate[date].map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`flex items-end gap-2 max-w-[80%] ${
                    message.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                  } cursor-pointer hover:opacity-90 transition-opacity`}
                  onClick={() => handleMessageClick(message.id)}
                >
                  <Avatar className="h-8 w-8">
                    {message.sender?.avatar_url && (
                      <img 
                        src={message.sender.avatar_url} 
                        alt={message.sender?.username || 'User'} 
                      />
                    )}
                    <AvatarFallback>
                      {message.sender_id === user?.id 
                        ? user.email?.charAt(0).toUpperCase() || 'Y'
                        : message.sender?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className={`px-4 py-2 rounded-xl ${
                      message.sender_id === user?.id 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-accent rounded-bl-none'
                    } ${selectedMessage === message.id ? 'ring-2 ring-offset-2 ring-primary' : ''}`}>
                      <p>{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mx-2">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </>
    );
  };

  if (!otherUserId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">Select a conversation or start a new one</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {isLoadingUser ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-[100px]" />
          </div>
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
      <div className="border-t p-4">
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
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
