
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import TennisAILayout from '@/components/tennis-ai/TennisAILayout';
import ChatContainer from '@/components/tennis-ai/ChatContainer';
import ConversationSidebar from '@/components/tennis-ai/ConversationSidebar';
import { Loading } from '@/components/ui/loading';
import { PreferencesDialog } from '@/components/tennis-ai/PreferencesDialog';
import { useTennisPreferences } from '@/hooks/use-tennis-preferences';
import { useTennisAIConversations } from '@/hooks/use-tennis-ai-conversations';
import { useTennisAIMessaging } from '@/hooks/use-tennis-ai-messaging';
import { useRealtimeConnection } from '@/hooks/use-realtime-connection';

const TennisAI = () => {
  console.log('TennisAI: Component initializing');
  
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  console.log('TennisAI: Auth state -', { 
    user: user ? 'exists' : 'null', 
    profile: profile ? 'exists' : 'null',
    isAuthLoading 
  });
  
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<{message: string; type?: string; retry?: () => void} | null>(null);
  const authCheckedRef = useRef(false);
  
  // Add new states for preferences
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const { preferences, isLoadingPreferences } = useTennisPreferences();
  
  // Connection status management
  const { connectionStatus, setConnectionStatus, checkAndConfigureRealtime } = useRealtimeConnection();
  
  // Conversation management
  const {
    currentConversation,
    setCurrentConversation,
    conversations,
    messages,
    setMessages,
    loadingConversations,
    loadingMessages,
    deleteDialogOpen,
    setDeleteDialogOpen,
    conversationToDelete,
    loadConversations,
    loadMessages,
    handleStartNewConversation,
    handleDeleteConversation,
    handleRenameConversation,
    handleConversationClick,
    confirmDeleteConversation
  } = useTennisAIConversations({
    userId: user?.id,
    onError: setApiError
  });
  
  // Optimistic message handling
  const addOptimisticMessage = useCallback((content: string) => {
    const optimisticUserMessage = {
      id: 'temp-' + Date.now(),
      content: content,
      is_from_ai: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMessage]);
  }, [setMessages]);
  
  const removeOptimisticMessages = useCallback(() => {
    setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
  }, [setMessages]);
  
  // Messaging functionality
  const {
    message,
    setMessage,
    isLoading,
    isReconnecting,
    handleSendMessage,
    handleReconnect
  } = useTennisAIMessaging({
    userId: user?.id,
    currentConversation,
    loadMessages,
    loadConversations,
    setCurrentConversation,
    onError: setApiError,
    addOptimisticMessage,
    removeOptimisticMessages
  });
  
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
  
  // Redirect to login if not authenticated - IMPROVED AUTH CHECK
  useEffect(() => {
    console.log('TennisAI: Auth check effect running', { 
      user: user ? 'exists' : 'null',
      isAuthLoading,
      authChecked: authCheckedRef.current
    });
    
    // Only run this check once after initial auth load is complete
    if (isAuthLoading) {
      console.log('TennisAI: Auth is still loading, waiting...');
      return;
    }
    
    // If auth check has already been performed, don't do it again
    if (authCheckedRef.current) {
      console.log('TennisAI: Auth check already performed');
      return;
    }
    
    // Mark auth check as performed to prevent repeated redirects
    authCheckedRef.current = true;
    
    if (!user) {
      console.log("TennisAI: User not authenticated, redirecting to auth page");
      toast.error("Please sign in to use the Tennis AI");
      navigate('/auth');
    } else {
      console.log("TennisAI: User is authenticated, continuing");
      
      // Check realtime configuration during initialization
      checkAndConfigureRealtime();
      
      // Load conversations if user is authenticated
      if (!loadingConversations && conversations.length === 0) {
        loadConversations();
      }
    }
  }, [user, navigate, isAuthLoading, checkAndConfigureRealtime, loadConversations, conversations.length, loadingConversations]);
  
  const handleApiErrorReset = () => {
    setApiError(null);
  };

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
  
  // Prepare the sidebar content
  const sidebarContent = (
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
  
  return (
    <>
      {/* Preferences Dialog */}
      <PreferencesDialog 
        open={showPreferencesDialog} 
        onOpenChange={setShowPreferencesDialog} 
      />

      <TennisAILayout 
        title="Tennis AI Assistant"
        sidebarContent={sidebarContent}
        onReconnect={handleReconnect}
        onPreferencesOpen={() => setShowPreferencesDialog(true)}
      >
        <ChatContainer
          messages={messages}
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
          isReconnecting={isReconnecting}
          loadingMessages={loadingMessages}
          apiError={apiError}
          onApiErrorReset={handleApiErrorReset}
        />
      </TennisAILayout>

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
    </>
  );
};

export default TennisAI;
