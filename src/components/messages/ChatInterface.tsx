
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/components/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loading } from '@/components/ui/loading';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageSquare } from 'lucide-react';
import { Message } from '@/types/messages';
import { Button } from '@/components/ui/button';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import ComposeMessage from './ComposeMessage';

interface ChatInterfaceProps {
  onError?: (error: string) => void;
  chatId?: string | null;
}

interface LocationState {
  initialMessage?: string;
  autoSend?: boolean;
  fromSearch?: boolean;
  previousPath?: string;
}

const ChatInterface = ({ onError, chatId: propChatId }: ChatInterfaceProps) => {
  const { chatId: paramChatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState || {};
  const conversationId = propChatId || paramChatId;
  
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [initialMessageProcessed, setInitialMessageProcessed] = useState(false);
  
  const validConversation = !!conversationId && conversationId !== 'undefined';

  // First fetch the conversation to get the other user's ID
  const { 
    data: conversationData, 
    isLoading: isLoadingConversation, 
    error: conversationError,
    refetch: refetchConversation
  } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!user || !validConversation) {
        console.error("No valid conversation ID provided", { user: !!user, conversationId });
        throw new Error("No valid conversation ID provided");
      }
      
      console.log(`Fetching conversation data for ID: ${conversationId}`);
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (error) {
        console.error("Error fetching conversation:", error);
        throw error;
      }
      
      console.log("Conversation data fetched successfully:", data);
      return data;
    },
    enabled: !!user && validConversation,
    retry: 2,
    staleTime: 30000 // 30 seconds
  });
  
  // Error handling for conversation fetching
  useEffect(() => {
    if (conversationError && onError) {
      console.error("Conversation error:", conversationError);
      onError("Failed to load conversation: " + (conversationError instanceof Error ? conversationError.message : JSON.stringify(conversationError)));
    }
  }, [conversationError, onError]);
  
  // Determine the other user ID from the conversation
  const otherUserId = conversationData ? 
    (conversationData.user1_id === user?.id ? conversationData.user2_id : conversationData.user1_id) 
    : null;

  const { 
    messages, 
    isLoadingMessages,
    error: messagesError,
    retryLoadMessages,
    addReaction,
    removeReaction,
    deleteMessage,
    setNewMessage,
    sendMessage,
    newMessage
  } = useMessages(validConversation ? conversationId : null);

  // Now fetch the other user's profile
  const { 
    data: otherUser, 
    isLoading: isLoadingUser, 
    error: userError,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: async () => {
      if (!otherUserId) {
        console.error("No valid user ID provided for profile fetch");
        throw new Error("No valid user ID provided");
      }
      
      console.log(`Fetching user profile for ID: ${otherUserId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherUserId)
        .single();
      
      if (error) {
        console.error("Error fetching user:", error);
        throw error;
      }
      
      console.log("User profile fetched successfully:", data);
      return data;
    },
    enabled: !!otherUserId,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 60000 // 1 minute
  });
  
  // Handle any errors
  useEffect(() => {
    if (messagesError && onError) {
      console.error("Messages error:", messagesError);
      onError(messagesError.message);
    }
    
    if (userError && onError) {
      console.error("User error:", userError);
      onError("Failed to load user information: " + (userError instanceof Error ? userError.message : JSON.stringify(userError)));
    }
  }, [messagesError, userError, onError]);

  // Retry loading if we have errors
  const handleRetry = useCallback(() => {
    if (conversationError) refetchConversation();
    if (userError) refetchUser();
    if (messagesError) retryLoadMessages();
  }, [conversationError, userError, messagesError, refetchConversation, refetchUser, retryLoadMessages]);

  // Handle initial message from navigation state with improved reliability
  useEffect(() => {
    if (locationState?.initialMessage && validConversation && !initialMessageProcessed && !isLoadingMessages) {
      console.log("Setting initial message:", locationState.initialMessage);
      // Set the message text from the navigation state
      setNewMessage(locationState.initialMessage);
      
      // Auto-send the message if requested
      if (locationState.autoSend) {
        // Use setTimeout to ensure the message state is updated before sending
        const timer = setTimeout(() => {
          console.log("Auto-sending initial message...");
          sendMessage();
          setInitialMessageProcessed(true);
          
          // Clear navigation state to prevent re-sending
          const newState = { ...locationState };
          delete newState.initialMessage;
          delete newState.autoSend;
          navigate('.', { state: newState, replace: true });
        }, 500); // Increased delay for more reliability
        
        return () => clearTimeout(timer);
      } else {
        setInitialMessageProcessed(true);
      }
    }
  }, [locationState, validConversation, isLoadingMessages, initialMessageProcessed, setNewMessage, sendMessage, navigate]);
  
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

  // Show loading state when fetching conversation data or user data
  if (isLoadingConversation || (isLoadingUser && otherUserId)) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading variant="spinner" text="Loading conversation..." />
      </div>
    );
  }

  // If we have errors, show error state with retry button
  if ((conversationError || userError || messagesError) && validConversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4 max-w-md text-center">
          {conversationError && <p className="mb-2">Error loading conversation data.</p>}
          {userError && <p className="mb-2">Error loading user information.</p>}
          {messagesError && <p className="mb-2">Error loading messages.</p>}
          <p className="text-sm opacity-80">Please try again.</p>
        </div>
        <Button 
          variant="default" 
          onClick={handleRetry}
          className="mb-4"
        >
          Retry
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/messages')}
        >
          Return to Messages
        </Button>
      </div>
    );
  }

  // If we have the conversation but no otherUserId, there might be an issue
  if (!isLoadingConversation && !otherUserId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4">
          Error loading conversation data. Please try again.
        </div>
        <button 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => navigate('/messages')}
        >
          Return to Messages
        </button>
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
          messages={messages as Message[]}
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
      
      <ComposeMessage 
        conversationId={conversationId} 
        initialMessage={!initialMessageProcessed ? locationState?.initialMessage : undefined}
      />
    </div>
  );
};

export default ChatInterface;
