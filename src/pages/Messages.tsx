
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import ConversationsList from '@/components/messages/ConversationsList';
import ChatInterface from '@/components/messages/ChatInterface';
import NewMessageDialog from '@/components/messages/NewMessageDialog';
import { MessageSquare, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: selectedUserId } = useParams<{ id: string }>();
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8 text-center">
        <p>Please log in to view your messages.</p>
      </div>
    );
  }

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
            New
          </Button>
        </div>
        
        {/* Mobile conversations list drawer */}
        {selectedUserId && (
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  Conversations
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
                    New Message
                  </Button>
                  <ConversationsList selectedUserId={selectedUserId} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(80vh-120px)]">
        {/* Conversations List - Hidden on mobile when a conversation is selected */}
        <div className={`border rounded-md overflow-hidden ${selectedUserId ? 'hidden md:block' : 'block'}`}>
          <div className="p-4 border-b">
            <h2 className="font-medium">Conversations</h2>
          </div>
          <div className="p-4 h-[calc(80vh-190px)] overflow-y-auto">
            <ConversationsList selectedUserId={selectedUserId} />
          </div>
        </div>
        
        {/* Chat Interface or Empty State */}
        <div className={`border rounded-md overflow-hidden ${
          selectedUserId ? 'block md:col-span-2' : 'hidden md:block md:col-span-2'
        }`}>
          {selectedUserId ? (
            <ChatInterface />
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
                New Message
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <NewMessageDialog open={newMessageOpen} onOpenChange={setNewMessageOpen} />
    </div>
  );
};

export default Messages;
