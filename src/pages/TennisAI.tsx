
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MessageList from '@/components/tennis-ai/MessageList';
import MessageInput from '@/components/tennis-ai/MessageInput';
import ConversationSidebar from '@/components/tennis-ai/ConversationSidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Loading } from '@/components/ui/loading';
import { TennisAIConversation } from '@/components/tennis-ai/types';

interface Message {
  id: string;
  content: string;
  is_from_ai: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const TennisAI = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [apiError, setApiError] = useState<{message: string; retry?: () => void} | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const realtimeChannelRef = useRef<any>(null);
  
  // Auto-retry for API failures
  const maxRetries = 3;
  const retryIntervalMs = 3000;
  const [retryCount, setRetryCount] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      console.log("User not authenticated, redirecting to auth page");
      toast.error("Please sign in to use the Tennis AI");
      navigate('/auth');
    } else {
      setLoadingConversations(true);
      loadConversations().finally(() => setLoadingConversations(false));
    }
  }, [user, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!currentConversation || !user) return;
    
    // Clean up any existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const setupChannel = () => {
      console.log(`Setting up realtime channel for conversation: ${currentConversation}`);
      const channel = supabase
        .channel(`tennis-ai-messages-${currentConversation}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `conversation_id=eq.${currentConversation}`
        }, (payload) => {
          console.log('New message received:', payload);
          loadMessages(currentConversation);
        })
        .subscribe((status) => {
          console.log('Channel status:', status);
          if (status !== 'SUBSCRIBED') {
            console.warn('Channel subscription failed, will retry');
            setTimeout(() => setupChannel(), 5000); // Retry after 5 seconds
          }
        });
        
      realtimeChannelRef.current = channel;
    };
    
    setupChannel();
    
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [currentConversation, user]);

  // Set up real-time subscription for conversations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`tennis-ai-conversations-${user.id}`)
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'ai_conversations',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Conversation change:', payload);
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setApiError(null);
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(30); // Increased limit for better history

      if (error) throw error;
      
      console.log('Loaded conversations:', data);
      setConversations(data || []);

      // If there are conversations and no current conversation selected, select the most recent one
      if (data && data.length > 0 && !currentConversation) {
        setCurrentConversation(data[0].id);
        setLoadingMessages(true);
        loadMessages(data[0].id).finally(() => setLoadingMessages(false));
      } else if (data && data.length === 0 && currentConversation) {
        // If no conversations left but we have a current conversation ID
        // (this might happen after deleting the last conversation)
        setCurrentConversation(null);
        setMessages([]);
      }
      
      return data;
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
      setApiError({
        message: 'Failed to load conversations. Please try again.',
        retry: () => {
          setLoadingConversations(true);
          loadConversations().finally(() => setLoadingConversations(false));
        }
      });
      return [];
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setApiError(null);
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      return data;
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      setApiError({
        message: 'Failed to load messages. Please try again.',
        retry: () => {
          setLoadingMessages(true);
          loadMessages(conversationId).finally(() => setLoadingMessages(false));
        }
      });
      return [];
    }
  };

  const handleStartNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setApiError(null);
  };

  const handleDeleteConversation = (id: string) => {
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    try {
      // Delete messages first (foreign key constraint)
      const { error: messagesError } = await supabase
        .from('ai_messages')
        .delete()
        .eq('conversation_id', conversationToDelete);
      
      if (messagesError) throw messagesError;
      
      // Then delete the conversation
      const { error: conversationError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationToDelete);
      
      if (conversationError) throw conversationError;
      
      console.log('Deleted conversation:', conversationToDelete);
      
      // Update local state immediately
      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== conversationToDelete);
        console.log('Updated conversations after delete:', filtered);
        return filtered;
      });
      
      // If the current conversation was deleted, reset state
      if (currentConversation === conversationToDelete) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      toast.success('Conversation deleted');
      
      // Force refresh conversations from the database
      setLoadingConversations(true);
      loadConversations().finally(() => setLoadingConversations(false));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  // New function to handle renaming conversations
  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!user || !id || !newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title: newTitle })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id ? { ...conv, title: newTitle } : conv
        )
      );
      
      toast.success('Conversation renamed');
    } catch (error) {
      console.error('Error renaming conversation:', error);
      toast.error('Failed to rename conversation');
    }
  };

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !user) return;

    try {
      setIsLoading(true);
      setApiError(null);
      
      // Optimistically add the message to the UI
      const optimisticUserMessage = {
        id: 'temp-' + Date.now(),
        content: message,
        is_from_ai: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticUserMessage]);
      
      const trimmedMessage = message.trim();
      setMessage('');

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('tennis-ai-chat', {
        body: {
          conversationId: currentConversation,
          message: trimmedMessage,
          userId: user.id
        }
      });

      if (error) {
        // If error, retry up to maxRetries times
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
        setCurrentConversation(data.conversationId);
        await loadConversations(); // Refresh the conversation list
      }

      // Load the latest messages including the AI response
      await loadMessages(data.conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      setApiError({
        message: 'Failed to get response from Tennis AI. Please try again.',
        retry: () => handleSendMessage(e)
      });
    } finally {
      setIsLoading(false);
    }
  }, [message, isLoading, user, currentConversation, retryCount]);

  const handleConversationClick = (conversationId: string) => {
    if (conversationId === currentConversation) return;
    
    setCurrentConversation(conversationId);
    setLoadingMessages(true);
    setMessages([]);
    setApiError(null);
    loadMessages(conversationId).finally(() => setLoadingMessages(false));
  };

  const ConversationSidebarContent = () => (
    <ConversationSidebar 
      conversations={conversations}
      currentConversation={currentConversation}
      handleConversationClick={handleConversationClick}
      handleStartNewConversation={handleStartNewConversation}
      handleDeleteConversation={handleDeleteConversation}
      handleRenameConversation={handleRenameConversation}
      isLoading={loadingConversations}
    />
  );

  if (!user) {
    return <div className="p-8 text-center">Please sign in to use the Tennis AI</div>;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tennis AI Assistant</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mobile sidebar drawer */}
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden mb-4 flex items-center">
                <Menu className="mr-2 h-4 w-4" />
                Conversations
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] sm:w-[350px]">
              <div className="h-full py-4">
                <ConversationSidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Desktop sidebar - visible on larger screens */}
        <div className="hidden lg:block">
          <ConversationSidebarContent />
        </div>

        {/* Chat area - takes up most of the space */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border shadow-sm h-[70vh] flex flex-col">
            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-4">
              {isReconnecting ? (
                <div className="h-full flex items-center justify-center">
                  <Loading 
                    variant="spinner" 
                    text="Reconnecting..." 
                    className="max-w-md mx-auto"
                  />
                </div>
              ) : (
                <MessageList 
                  messages={messages} 
                  isLoading={isLoading || loadingMessages}
                  error={apiError}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t p-4">
              <MessageInput
                message={message}
                setMessage={setMessage}
                handleSendMessage={handleSendMessage}
                isLoading={isLoading || isReconnecting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TennisAI;
