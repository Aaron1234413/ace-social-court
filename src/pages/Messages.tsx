
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { MessageSquarePlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import MessageSearch from '@/components/messages/MessageSearch';
import ConversationsList from '@/components/messages/ConversationsList';
import ChatInterface from '@/components/messages/ChatInterface';
import NewMessageButton from '@/components/messages/NewMessageButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loading } from '@/components/ui/loading';
import { configureRealtime } from '@/utils/realtimeHelper';
import { useCreateConversation } from '@/hooks/use-create-conversation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId?: string }>();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<'conversations' | 'search'>('conversations');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isProcessingUserId, setIsProcessingUserId] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extract state from navigation, if any
  const locationState = location.state || {};
  const { fromSearch, previousPath } = locationState;
  
  // Get conversation creation function
  const { createConversation, isCreating } = useCreateConversation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  // Check if the chatId is a user ID or a conversation ID
  useEffect(() => {
    const checkChatIdType = async () => {
      if (!chatId || !user || isProcessingUserId) return;
      
      try {
        // First check if chatId is a valid conversation ID
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', chatId)
          .maybeSingle();
          
        if (conversationData) {
          // It's a valid conversation ID
          console.log('Valid conversation ID found:', chatId);
          setSelectedConversationId(chatId);
          return;
        }
        
        // If not a conversation ID, check if it's a valid user ID
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', chatId)
          .maybeSingle();
        
        if (userData) {
          // It's a user ID, initiate conversation creation
          console.log('User ID detected, creating conversation with user:', chatId);
          setIsProcessingUserId(true);
          
          createConversation(chatId, {
            onSuccess: (conversationId) => {
              console.log('Created/found conversation:', conversationId);
              // Navigate to the actual conversation with the proper ID
              navigate(`/messages/${conversationId}`, {
                state: locationState,
                replace: true // Replace current URL in history to avoid back button issues
              });
              setIsProcessingUserId(false);
            },
            onError: (error) => {
              console.error('Error creating conversation:', error);
              toast.error('Could not create conversation');
              setError('Failed to create conversation. Please try again.');
              setIsProcessingUserId(false);
            }
          });
        } else {
          // Not a valid user ID or conversation ID
          setError(`Invalid ID: ${chatId}`);
          console.error('Invalid ID provided, not a conversation or valid user');
        }
      } catch (err) {
        console.error('Error checking chat ID type:', err);
        setError('Error checking conversation details');
        setIsProcessingUserId(false);
      }
    };
    
    checkChatIdType();
  }, [chatId, user, navigate, createConversation, locationState, isProcessingUserId]);
  
  // Configure realtime subscriptions on component mount
  useEffect(() => {
    if (user) {
      // Check and configure realtime for the message tables
      configureRealtime()
        .then(result => {
          if (result.success) {
            console.log('Realtime configuration successful');
          } else {
            console.warn('Realtime configuration issue:', result.error);
          }
        })
        .catch(err => {
          console.error('Failed to configure realtime:', err);
        });
    }
  }, [user]);
  
  // Handle selecting a conversation from the list
  const handleConversationSelect = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };
  
  // Handle going back to search with state preservation
  const handleBackToSearch = () => {
    if (previousPath && previousPath.includes('/search')) {
      navigate(previousPath);
    } else {
      navigate('/search');
    }
  };
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };
  
  // Handle user selection from search
  const handleUserSelect = (user: any) => {
    if (user && user.id) {
      navigate(`/messages/${user.id}`, {
        state: { fromSearch: true, previousPath: window.location.pathname }
      });
    }
  };
  
  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquarePlus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-medium">Sign in to access messages</h2>
          <p className="text-muted-foreground max-w-md">
            Please log in to view your conversations and connect with other users
          </p>
          <Button onClick={() => navigate('/auth')}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isProcessingUserId || isCreating) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Loading variant="spinner" text="Creating conversation..." />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        
        {fromSearch && previousPath && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBackToSearch}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        )}
        
        {!isMobile && <NewMessageButton size="sm" />}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
          <Button 
            variant="link" 
            className="p-0 h-auto text-destructive ml-2" 
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-180px)] bg-background/50 rounded-lg overflow-hidden border shadow-sm">
        {/* Left Side - Conversations & Search */}
        <div className={`md:col-span-1 border-r overflow-hidden flex flex-col ${
          isMobile && selectedConversationId ? 'hidden md:flex' : ''
        }`}>
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex flex-col h-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-background">
              <TabsTrigger value="conversations" className="rounded-none data-[state=active]:bg-accent/50">Conversations</TabsTrigger>
              <TabsTrigger value="search" className="rounded-none data-[state=active]:bg-accent/50">Search</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conversations" className="p-4 flex-1 overflow-y-auto border-0">
              <ConversationsList 
                currentConversationId={selectedConversationId} 
                onSelectConversation={handleConversationSelect} 
              />
            </TabsContent>
            
            <TabsContent value="search" className="p-4 flex-1 overflow-y-auto border-0">
              <MessageSearch onSelectUser={handleUserSelect} />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Side - Message Thread */}
        <div className={`md:col-span-2 overflow-hidden flex flex-col ${
          isMobile && !selectedConversationId ? 'hidden md:flex' : ''
        }`}>
          {isMobile && selectedConversationId && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden m-2 w-fit"
              onClick={() => navigate('/messages')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to conversations
            </Button>
          )}
          <ChatInterface 
            chatId={selectedConversationId} 
            onError={handleError} 
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
