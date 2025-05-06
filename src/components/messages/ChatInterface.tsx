
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/components/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInput from './MessageInput';

interface ChatInterfaceProps {
  onError?: (error: string) => void;
}

const ChatInterface = ({ onError }: ChatInterfaceProps) => {
  const { chatId } = useParams<{ chatId: string }>();
  const otherUserId = chatId;
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  
  // Check if we have a valid otherUserId
  const validConversation = !!otherUserId && otherUserId !== 'undefined';
  
  const { 
    messages, 
    isLoadingMessages,
    error: messagesError,
    newMessage, 
    setNewMessage, 
    sendMessage,
    isSending,
    mediaPreview,
    mediaFile,
    mediaType,
    uploadProgress,
    handleMediaSelect,
    clearMedia,
    addReaction,
    removeReaction,
    deleteMessage
  } = useMessages(validConversation ? otherUserId : undefined);
  
  // Handle any errors
  useEffect(() => {
    if (messagesError && onError) {
      onError(messagesError.message);
    }
  }, [messagesError, onError]);
  
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validConversation) {
      if (onError) onError("Cannot send message: Invalid conversation");
      return;
    }
    
    if (newMessage.trim() || mediaFile) {
      try {
        sendMessage();
      } catch (error) {
        console.error("Error sending message:", error);
        if (error instanceof Error && onError) {
          onError("Failed to send message: " + error.message);
        }
      }
    }
  }, [newMessage, mediaFile, sendMessage, onError, validConversation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((newMessage.trim() || mediaFile) && validConversation) {
        sendMessage();
      }
    }
  }, [newMessage, mediaFile, sendMessage, validConversation]);
  
  const handleMessageClick = useCallback((messageId: string) => {
    setSelectedMessage(messageId === selectedMessage ? null : messageId);
  }, [selectedMessage]);

  // Helper to handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
    
    // Validate file
    if (fileType === 'image' && file.size > 5 * 1024 * 1024) {
      onError?.("Image file is too large (max 5MB)");
      return;
    }
    
    if (fileType === 'video' && file.size > 20 * 1024 * 1024) {
      onError?.("Video file is too large (max 20MB)");
      return;
    }
    
    handleMediaSelect(file, fileType);
    
    // Reset input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleMediaSelect, onError]);
  
  // Helper to trigger file input click
  const triggerFileInput = useCallback((type: 'image' | 'video') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
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
      
      <MessageInput 
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        isSending={isSending}
        mediaPreview={mediaPreview}
        mediaType={mediaType}
        uploadProgress={uploadProgress}
        clearMedia={clearMedia}
        onFileSelect={handleFileSelect}
        triggerFileInput={triggerFileInput}
        handleKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default ChatInterface;
