
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import ConversationsList from '@/components/messages/ConversationsList';
import ChatInterface from '@/components/messages/ChatInterface';
import NewMessageDialog from '@/components/messages/NewMessageDialog';
import { MessageSquare, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ErrorAlert } from '@/components/ui/error-alert';
import ErrorBoundary from '@/components/tennis-ai/ErrorBoundary';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId?: string }>();
  
  // Get the selectedUserId from the URL parameters - ensure it's valid and not 'undefined' string
  const selectedUserId = chatId && chatId !== 'undefined' ? chatId : null;
  
  console.log("Messages page - extracted selectedUserId:", selectedUserId);
  
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Ensure components re-render when route changes
  useEffect(() => {
    console.log("Messages page - selectedUserId from params:", selectedUserId);
    console.log("Current location:", location.pathname);
    // Clear any previous errors when route changes
    setError(null);
  }, [selectedUserId, location]);

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8 text-center">
        <p>Please log in to view your messages.</p>
      </div>
    );
  }

  const handleError = (errorMessage: string) => {
    console.error("Messaging error:", errorMessage);
    setError(errorMessage);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
        
        {/* Mobile new message button */}
        <div className="md:hidden">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setNewMessageOpen(true)}
            className="gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>New</span>
          </Button>
        </div>
        
        {/* Mobile conversations list drawer */}
        {selectedUserId && (
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <span>Conversations</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-md p-0">
                <div className="p-4 border-b">
                  <h2 className="font-medium">Conversations</h2>
                </div>
                <div className="p-4 overflow-y-auto h-full">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 mb-4" 
                    onClick={() => setNewMessageOpen(true)}
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    <span>New Message</span>
                  </Button>
                  <ErrorBoundary>
                    <ConversationsList 
                      selectedUserId={selectedUserId} 
                      onError={handleError}
                    />
                  </ErrorBoundary>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
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
        {/* Conversations List - Hidden on mobile when a conversation is selected */}
        <div className={`border rounded-md overflow-hidden ${selectedUserId ? 'hidden md:block' : 'block'}`}>
          <div className="p-4 border-b">
            <h2 className="font-medium">Conversations</h2>
          </div>
          <div className="p-4 h-[calc(80vh-190px)] overflow-y-auto">
            <ErrorBoundary>
              <ConversationsList 
                selectedUserId={selectedUserId} 
                onError={handleError}
              />
            </ErrorBoundary>
          </div>
        </div>
        
        {/* Chat Interface or Empty State */}
        <div className={`border rounded-md overflow-hidden ${
          selectedUserId ? 'block md:col-span-2' : 'hidden md:block md:col-span-2'
        }`}>
          <ErrorBoundary>
            {selectedUserId ? (
              <ChatInterface key={selectedUserId} onError={handleError} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                <p>Select a conversation from the list or start a new one.</p>
                <Button 
                  variant="outline"
                  className="mt-6 gap-2"
                  onClick={() => setNewMessageOpen(true)}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  <span>New Message</span>
                </Button>
              </div>
            )}
          </ErrorBoundary>
        </div>
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
