
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import ConversationsList from '@/components/messages/ConversationsList';
import ChatInterface from '@/components/messages/ChatInterface';
import NewMessageDialog from '@/components/messages/NewMessageDialog';
import { MessageSquare, MessageSquarePlus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ErrorAlert } from '@/components/ui/error-alert';
import ErrorBoundary from '@/components/tennis-ai/ErrorBoundary';
import { useIsMobile } from '@/hooks/use-mobile';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId?: string }>();
  const isMobile = useIsMobile();
  
  // Ensure we have a valid selectedUserId
  const selectedUserId = useMemo(() => {
    return chatId && chatId !== 'undefined' ? chatId : null;
  }, [chatId]);
  
  console.log("Messages page - extracted selectedUserId:", selectedUserId);
  
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Ensure components re-render when route changes
  useEffect(() => {
    console.log("Messages page - Current location:", location.pathname);
    console.log("Messages page - selectedUserId from params:", selectedUserId);
    
    // Clear any previous errors when route changes
    setError(null);
  }, [selectedUserId, location]);

  const handleError = useCallback((errorMessage: string) => {
    console.error("Messaging error:", errorMessage);
    setError(errorMessage);
  }, []);

  const handleConversationSelect = useCallback((userId: string) => {
    console.log(`Selecting conversation: ${userId}`);
    navigate(`/messages/${userId}`);
    // Close the sidebar on mobile after selecting a conversation
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [navigate, isMobile]);

  // Determine which view to show based on screen size and selected conversation
  const showConversationsList = useMemo(() => !isMobile || !selectedUserId, [isMobile, selectedUserId]);
  const showChatInterface = useMemo(() => !isMobile || selectedUserId, [isMobile, selectedUserId]);

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8 text-center">
        <p>Please log in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Tennis-themed decorative elements */}
      <div className="absolute top-10 right-10 w-48 h-48 bg-tennis-highlight/10 rounded-full blur-3xl -z-10 animate-pulse-subtle"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-tennis-green/10 rounded-full blur-3xl -z-10 animate-pulse-subtle"></div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-tennis-green to-tennis-darkGreen bg-clip-text text-transparent">
          Messages
        </h1>
        
        <div className="flex gap-2">
          {/* Mobile view controls */}
          {isMobile && selectedUserId && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-tennis-green/30 hover:bg-tennis-green/10">
                  <Smartphone className="h-4 w-4 text-tennis-green" />
                  <span>Conversations</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:max-w-md p-0 bg-gradient-to-b from-white to-[#F2FCE2]/50">
                <div className="p-4 border-b border-tennis-green/20 flex items-center justify-between">
                  <h2 className="font-medium text-lg text-tennis-darkGreen">Conversations</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewMessageOpen(true)}
                    className="gap-2 border-tennis-green/30 hover:bg-tennis-green/10"
                  >
                    <MessageSquarePlus className="h-4 w-4 text-tennis-green" />
                    <span>New</span>
                  </Button>
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100vh-100px)]">
                  <ErrorBoundary>
                    <ConversationsList 
                      selectedUserId={selectedUserId} 
                      onError={handleError}
                      onSelectConversation={handleConversationSelect}
                    />
                  </ErrorBoundary>
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          <Button 
            variant="default" 
            size="sm"
            onClick={() => setNewMessageOpen(true)}
            className="gap-2 bg-tennis-green hover:bg-tennis-darkGreen text-white"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>New Message</span>
          </Button>
        </div>
      </div>
      
      {error && (
        <ErrorAlert 
          message={error}
          severity="error"
          onRetry={() => setError(null)}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(80vh-120px)]">
        {/* Conversations List */}
        {showConversationsList && (
          <div className={`border-tennis-green/20 border rounded-xl overflow-hidden shadow-md bg-white/50 backdrop-blur-sm ${isMobile ? 'md:col-span-1' : 'md:col-span-1'}`}>
            <div className="p-4 border-b border-tennis-green/20 bg-[#F2FCE2]/50">
              <h2 className="font-medium text-tennis-darkGreen">Conversations</h2>
            </div>
            <div className="p-4 h-[calc(80vh-190px)] overflow-y-auto">
              <ErrorBoundary>
                <ConversationsList 
                  selectedUserId={selectedUserId} 
                  onError={handleError}
                  onSelectConversation={handleConversationSelect}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}
        
        {/* Chat Interface or Empty State */}
        {showChatInterface ? (
          <div className={`border-tennis-green/20 border rounded-xl overflow-hidden shadow-md ${
            isMobile ? 'col-span-1' : 'md:col-span-2'
          }`}>
            <ErrorBoundary>
              {selectedUserId ? (
                <ChatInterface 
                  key={selectedUserId} 
                  onError={handleError}
                  chatId={selectedUserId} // Pass the selected user ID directly
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-gradient-to-b from-white to-[#F2FCE2]/30">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center bg-tennis-green/10 mb-6">
                    <MessageSquare className="h-12 w-12 text-tennis-green opacity-60" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-tennis-darkGreen">No conversation selected</h3>
                  <p className="text-muted-foreground">Select a conversation from the list or start a new one.</p>
                  <Button 
                    variant="outline"
                    className="mt-6 gap-2 border-tennis-green/30 hover:bg-tennis-green/10 text-tennis-darkGreen"
                    onClick={() => setNewMessageOpen(true)}
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    <span>New Message</span>
                  </Button>
                </div>
              )}
            </ErrorBoundary>
          </div>
        ) : (
          // Mobile view when no conversation is selected - this is handled by the conditional rendering above
          null
        )}
      </div>
      
      <NewMessageDialog 
        open={newMessageOpen} 
        onOpenChange={(open) => {
          setNewMessageOpen(open);
          // Force refresh the conversations list when dialogue closes
          if (!open) {
            // Small delay to ensure state updates
            setTimeout(() => {
              window.dispatchEvent(new Event('conversations-refresh'));
            }, 100);
          }
        }} 
        onError={handleError}
      />
    </div>
  );
};

export default Messages;
