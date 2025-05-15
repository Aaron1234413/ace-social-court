
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseMessagingOptions {
  userId: string | undefined;
  currentConversation: string | null;
  loadMessages: (conversationId: string) => Promise<any>;
  loadConversations: () => Promise<any>;
  setCurrentConversation: (id: string | null) => void;
  onError: (error: { message: string; type?: string; retry?: () => void } | null) => void;
  addOptimisticMessage: (content: string) => void;
  removeOptimisticMessages: () => void;
}

export const useTennisAIMessaging = ({
  userId,
  currentConversation,
  loadMessages,
  loadConversations,
  setCurrentConversation,
  onError,
  addOptimisticMessage,
  removeOptimisticMessages
}: UseMessagingOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Constants for retry logic
  const maxRetries = 3;
  const retryIntervalMs = 3000;

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !userId) return;

    try {
      setIsLoading(true);
      onError(null);
      
      // Optimistically add the message to the UI
      addOptimisticMessage(message);
      
      const trimmedMessage = message.trim();
      setMessage('');

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('tennis-ai-chat', {
        body: {
          conversationId: currentConversation,
          message: trimmedMessage,
          userId: userId
        }
      });

      if (error) {
        // Check if error is about OpenAI quota
        const isQuotaError = error.message?.includes('quota') || 
                             error.message?.includes('exceeded') || 
                             error.message?.includes('OpenAI API');
                             
        if (isQuotaError) {
          console.error('OpenAI API quota exceeded:', error);
          onError({
            message: 'OpenAI API quota exceeded. Please check your billing details or contact the administrator.',
            type: 'quota_exceeded'
          });
          
          // Remove the optimistic message on quota error
          removeOptimisticMessages();
          return;
        }
        
        // For other errors, try to retry
        if (retryCount < maxRetries) {
          setRetryCount(retryCount + 1);
          toast.warning(`Connection issue, retrying (${retryCount + 1}/${maxRetries})...`);
          // Use exponential backoff
          const backoffTime = retryIntervalMs * Math.pow(2, retryCount);
          
          setIsReconnecting(true);
          setTimeout(() => {
            setIsReconnecting(false);
            handleSendMessage(e);
          }, backoffTime);
          return;
        } else {
          throw error;
        }
      }

      // Reset retry count on successful request
      setRetryCount(0);

      // If this created a new conversation, update the current conversation ID
      if (data.conversationId !== currentConversation) {
        console.log(`New conversation created: ${data.conversationId}`);
        setCurrentConversation(data.conversationId);
        await loadConversations(); // Refresh the conversation list
      }

      // Load the latest messages including the AI response
      await loadMessages(data.conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show specific error message based on the error type
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      
      // Check if error is related to conversation not found
      if (errorMessage.includes('Conversation not found')) {
        toast.error('Conversation not found or was deleted');
        
        // Reset conversation state and reload conversations
        setCurrentConversation(null);
        loadConversations();
        
      } else {
        toast.error('Failed to send message');
        
        // Remove the optimistic message on error
        removeOptimisticMessages();
        
        onError({
          message: errorMessage,
          retry: () => handleSendMessage(e)
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [message, isLoading, userId, currentConversation, retryCount, maxRetries, retryIntervalMs]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    
    try {
      // Force refresh conversations
      await loadConversations();
      
      // Reset any API errors
      onError(null);
      
      // If we have a current conversation, reload its messages
      if (currentConversation) {
        await loadMessages(currentConversation);
      }
      
      // Reset retry count
      setRetryCount(0);
      
      toast.success('Reconnected successfully');
    } catch (error) {
      console.error('Reconnection failed:', error);
      toast.error('Failed to reconnect. Please try again.');
    } finally {
      setIsReconnecting(false);
    }
  };

  return {
    message,
    setMessage,
    isLoading,
    isReconnecting,
    handleSendMessage,
    handleReconnect
  };
};
