
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/components/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loading } from '@/components/ui/loading';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageSquare } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import ComposeMessage from './ComposeMessage';

interface ChatInterfaceProps {
  onError?: (error: string) => void;
  chatId?: string;
}

const ChatInterface = ({ onError, chatId: propChatId }: ChatInterfaceProps) => {
  const { chatId: paramChatId } = useParams<{ chatId: string }>();
  const otherUserId = propChatId || paramChatId;
  
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  
  const validConversation = !!otherUserId && otherUserId !== 'undefined';

  const { 
    messages, 
    isLoadingMessages,
    error: messagesError,
    addReaction,
    removeReaction,
    deleteMessage
  } = useMessages(validConversation ? otherUserId : null);
  
  // Handle any errors
  useEffect(() => {
    if (messagesError && onError) {
      onError(messagesError.message);
    }
  }, [messagesError, onError]);

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
  
  const handleMessageClick = useCallback((messageId: string) => {
    setSelectedMessage(messageId === selectedMessage ? null : messageId);
  }, [selectedMessage]);

  // Display better empty state if no valid conversation
  if (!validConversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-background/50">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageSquare className="h-12 w-12 text-primary opacity-60" />
        </div>
        <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
        <p className="text-muted-foreground text-center max-w-xs">
          Choose an existing conversation or start a new one to begin messaging
        </p>
      </div>
    );
  }

  if (isLoadingUser || isLoadingMessages) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading variant="spinner" text="Loading conversation..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ChatHeader 
        otherUser={otherUser}
        isLoading={isLoadingUser}
        hasError={!!userError}
      />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessagesList 
          messages={messages}
          isLoading={isLoadingMessages}
          error={messagesError}
          selectedMessage={selectedMessage}
          handleMessageClick={handleMessageClick}
          onAddReaction={addReaction}
          onRemoveReaction={removeReaction}
          onDeleteMessage={deleteMessage}
          otherUser={otherUser}
          isTyping={isTyping}
        />
      </div>
      
      <ComposeMessage conversationId={otherUserId} />
    </div>
  );
};

export default ChatInterface;
