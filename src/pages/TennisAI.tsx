import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MessageList from '@/components/tennis-ai/MessageList';
import MessageInput from '@/components/tennis-ai/MessageInput';
import ConversationSidebar from '@/components/tennis-ai/ConversationSidebar';
import ErrorBoundary from '@/components/tennis-ai/ErrorBoundary';
import ConnectionStatus from '@/components/tennis-ai/ConnectionStatus';
import { checkRealtimeHealth, configureRealtime } from '@/utils/realtimeHelper';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Loading } from '@/components/ui/loading';
import { TennisAIConversation } from '@/components/tennis-ai/types';
import { PreferencesDialog } from '@/components/tennis-ai/PreferencesDialog';
import { useTennisPreferences } from '@/hooks/use-tennis-preferences';

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
  console.log('TennisAI: Component initializing');
  
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  console.log('TennisAI: Auth state -', { 
    user: user ? 'exists' : 'null', 
    profile: profile ? 'exists' : 'null',
    isAuthLoading 
  });
  
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
  const [apiError, setApiError] = useState<{message: string; type?: string; retry?: () => void} | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const realtimeChannelRef = useRef<any>(null);
  
  // Add new states for preferences
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const { preferences, isLoadingPreferences } = useTennisPreferences();
  
  console.log('TennisAI: Tennis preferences -', { 
    preferences: preferences ? 'exists' : 'null', 
    isLoadingPreferences 
  });
  
  // Show preferences dialog if user has no preferences
  useEffect(() => {
    console.log('TennisAI: Preferences effect running', { 
      user: user ? 'exists' : 'null',
      preferences: preferences ? 'exists' : 'null',
      isLoadingPreferences
    });
    
    if (user && preferences === null && !isLoadingPreferences) {
      console.log('TennisAI: No preferences found, will show dialog after timer');
      // Wait a moment before showing the dialog to avoid immediate popup on page load
      const timer = setTimeout(() => {
        console.log('TennisAI: Showing preferences dialog');
        setShowPreferencesDialog(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, preferences, isLoadingPreferences]);
  
  // Auto-retry for API failures
  const maxRetries = 3;
  const retryIntervalMs = 3000;
  const [retryCount, setRetryCount] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('TennisAI: Auth check effect running', { 
      user: user ? 'exists' : 'null',
      isAuthLoading 
    });
    
    // Avoid redirect during initial auth loading
    if (isAuthLoading) {
      console.log('TennisAI: Auth is still loading, waiting...');
      return;
    }
    
    if (!user) {
      console.log("TennisAI: User not authenticated, redirecting to auth page");
      toast.error("Please sign in to use the Tennis AI");
      navigate('/auth');
    } else {
      console.log("TennisAI: User is authenticated, loading conversations");
      setLoadingConversations(true);
      loadConversations().finally(() => setLoadingConversations(false));
      
      // Check realtime configuration during initialization
      checkAndConfigureRealtime();
    }
  }, [user, navigate, isAuthLoading]);

  // Check and configure realtime
  const checkAndConfigureRealtime = async () => {
    try {
      const healthStatus = await checkRealtimeHealth();
      setConnectionStatus(healthStatus.channelConnected ? 'connected' : 'disconnected');
      
      if (!healthStatus.channelConnected) {
        console.log('Realtime connection issues detected, attempting to configure...');
        const configResult = await configureRealtime();
        console.log('Realtime configuration result:', configResult);
        
        // Re-check health after configuration
        const newStatus = await checkRealtimeHealth();
        setConnectionStatus(newStatus.channelConnected ? 'connected' : 'disconnected');
      }
    } catch (error) {
      console.error('Error during realtime configuration check:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time subscription for conversations
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up realtime channel for conversations");
    
    const channel = supabase
      .channel(`tennis-ai-conversations-${user.id}`)
      .on('postgres_changes', {
        event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'ai_conversations',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Conversation change detected:', payload);
        
        // Handle different types of changes
        if (payload.eventType === 'DELETE') {
          console.log('Conversation deleted from database:', payload.old);
          // Remove the deleted conversation from local state
          setConversations(prev => {
            const filtered = prev.filter(c => c.id !== payload.old.id);
            console.log('Updated conversations after DELETE event:', filtered);
            return filtered;
          });
          
          // Reset current conversation if it was the one deleted
          if (currentConversation === payload.old.id) {
            console.log('Current conversation was deleted, resetting state');
            setCurrentConversation(null);
            setMessages([]);
          }
        } else {
          // For INSERT and UPDATE, just refresh the conversations list
          loadConversations();
        }
      })
      .subscribe((status) => {
        console.log('Conversation channel status:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
        
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('Conversation channel subscription failed, will retry');
          setConnectionStatus('disconnected');
        }
      });

    return () => {
      console.log('Removing conversation channel');
      supabase.removeChannel(channel);
    };
  }, [user, currentConversation]);

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

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Check realtime health
      const healthStatus = await checkRealtimeHealth();
      setConnectionStatus(healthStatus.channelConnected ? 'connected' : 'disconnected');
      
      // Force refresh conversations
      await loadConversations();
      
      // Reset any API errors
      setApiError(null);
      
      // If we have a current conversation, reload its messages
      if (currentConversation) {
        await loadMessages(currentConversation);
      }
      
      // Reset retry count
      setRetryCount(0);
      
      toast.success('Reconnected successfully');
    } catch (error) {
      console.error('Reconnection failed:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to reconnect. Please try again.');
    } finally {
      setIsReconnecting(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setApiError(null);
      console.log("TennisAI: Loading conversations from database...");
      
      if (!user) {
        console.log("TennisAI: User is null, cannot load conversations");
        return [];
      }
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      
      console.log(`TennisAI: Loaded ${data?.length || 0} conversations:`, data);
      setConversations(data || []);

      // If there are conversations and no current conversation selected, select the most recent one
      if (data && data.length > 0 && !currentConversation) {
        console.log(`TennisAI: Selecting first conversation: ${data[0].id}`);
        setCurrentConversation(data[0].id);
        setLoadingMessages(true);
        loadMessages(data[0].id).finally(() => setLoadingMessages(false));
      } else if (data && data.length === 0 && currentConversation) {
        // If no conversations left but we have a current conversation ID
        // (this might happen after deleting the last conversation)
        console.log("TennisAI: No conversations left, resetting current conversation");
        setCurrentConversation(null);
        setMessages([]);
      }
      
      return data;
    } catch (error) {
      console.error('TennisAI: Error loading conversations:', error);
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
      console.log(`Loading messages for conversation: ${conversationId}`);
      
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      console.log(`Loaded ${data?.length || 0} messages`);
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
      console.log(`Starting deletion process for conversation: ${conversationToDelete}`);
      
      // Optimistically update UI immediately
      // Update local state before making the API call for instant UI feedback
      setConversations(prev => {
        const filtered = prev.filter(conv => conv.id !== conversationToDelete);
        console.log('Optimistically updated conversations list:', filtered);
        return filtered;
      });
      
      // If the current conversation was deleted, reset state
      if (currentConversation === conversationToDelete) {
        console.log('Current conversation is being deleted, resetting state');
        setCurrentConversation(null);
        setMessages([]);
      }
      
      // Delete messages first (foreign key constraint)
      console.log(`Deleting messages for conversation: ${conversationToDelete}`);
      const { error: messagesError } = await supabase
        .from('ai_messages')
        .delete()
        .eq('conversation_id', conversationToDelete);
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw messagesError;
      }
      
      // Then delete the conversation
      console.log(`Deleting conversation: ${conversationToDelete}`);
      const { error: conversationError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationToDelete);
      
      if (conversationError) {
        console.error('Error deleting conversation:', conversationError);
        throw conversationError;
      }
      
      console.log(`Successfully deleted conversation: ${conversationToDelete}`);
      toast.success('Conversation deleted');
      
      // Force refresh conversations from the database to ensure UI is in sync
      setLoadingConversations(true);
      await loadConversations();
      setLoadingConversations(false);
      
      // Select the first available conversation if any
      if (conversations.length > 0 && !currentConversation) {
        const firstConversation = conversations[0];
        console.log(`Selecting first available conversation: ${firstConversation.id}`);
        setCurrentConversation(firstConversation.id);
        setLoadingMessages(true);
        await loadMessages(firstConversation.id);
        setLoadingMessages(false);
      }
    } catch (error) {
      console.error('Error during deletion process:', error);
      toast.error('Failed to delete conversation');
      
      // Reload conversations to restore correct state
      setLoadingConversations(true);
      loadConversations().finally(() => setLoadingConversations(false));
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  // Function to handle renaming conversations
  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!user || !id || !newTitle.trim()) return;
    
    try {
      console.log(`Renaming conversation ${id} to "${newTitle}"`);
      
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
        // Check if error is about OpenAI quota
        const isQuotaError = error.message?.includes('quota') || 
                             error.message?.includes('exceeded') || 
                             error.message?.includes('OpenAI API');
                             
        if (isQuotaError) {
          console.error('OpenAI API quota exceeded:', error);
          setApiError({
            message: 'OpenAI API quota exceeded. Please check your billing details or contact the administrator.',
            type: 'quota_exceeded'
          });
          
          // Remove the optimistic message on quota error
          setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
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
        setMessages([]);
        loadConversations();
        
      } else {
        toast.error('Failed to send message');
        
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
        
        setApiError({
          message: errorMessage,
          retry: () => handleSendMessage(e)
        });
      }
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

  if (isAuthLoading) {
    console.log('TennisAI: Rendering loading state while auth is loading');
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="h-[70vh] flex items-center justify-center">
          <Loading variant="spinner" text="Preparing Tennis AI..." />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('TennisAI: Rendering not authenticated message');
    return <div className="p-8 text-center">Please sign in to use the Tennis AI</div>;
  }

  console.log('TennisAI: Rendering full component');
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Preferences Dialog */}
      <PreferencesDialog 
        open={showPreferencesDialog} 
        onOpenChange={setShowPreferencesDialog} 
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tennis AI Assistant</h1>
        
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() => setShowPreferencesDialog(true)}
          >
            Preferences
          </Button>
          <ConnectionStatus 
            onReconnect={handleReconnect} 
            className="ml-2" 
          />
        </div>
      </div>

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
            <ErrorBoundary 
              onReset={() => {
                setApiError(null);
                setIsReconnecting(false);
              }}
            >
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
            </ErrorBoundary>

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
