
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import MessageSearch from '@/components/messages/MessageSearch';
import ConversationList from '@/components/messages/ConversationList';
import MessageThread from '@/components/messages/MessageThread';
import ComposeMessage from '@/components/messages/ComposeMessage';
import { useCreateConversation } from '@/hooks/useConversations';
import { useIsMobile } from '@/hooks/use-mobile';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId?: string }>();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<'conversations' | 'search'>('conversations');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(chatId || null);
  
  const { createConversation } = useCreateConversation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  // Update selected conversation when route changes
  useEffect(() => {
    if (chatId) {
      setSelectedConversationId(chatId);
    }
  }, [chatId]);
  
  // Handle selecting a user from search
  const handleUserSelect = async (user: any) => {
    try {
      // Create or get conversation with this user
      await createConversation(user.id);
      
      // Navigate to this conversation
      navigate(`/messages/${user.id}`);
      
      // Switch back to conversations tab
      setActiveTab('conversations');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  // Handle selecting a conversation from the list
  const handleConversationSelect = (userId: string) => {
    navigate(`/messages/${userId}`);
  };
  
  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-16 text-center">
        <p>Please log in to view your messages</p>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        
        {!isMobile && (
          <Button 
            onClick={() => setActiveTab('search')}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>New Message</span>
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh]">
        {/* Left Side - Conversations & Search */}
        <div className="border rounded-md md:col-span-1 overflow-hidden flex flex-col">
          {isMobile && !selectedConversationId ? (
            <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="conversations" className="flex-1">Conversations</TabsTrigger>
                <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversations" className="p-4 overflow-y-auto">
                <ConversationList 
                  selectedConversationId={selectedConversationId} 
                  onSelectConversation={handleConversationSelect} 
                />
              </TabsContent>
              
              <TabsContent value="search" className="p-4">
                <MessageSearch onSelectUser={handleUserSelect} />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {!isMobile && (
                <div className="p-4 border-b">
                  <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList className="w-full">
                      <TabsTrigger value="conversations" className="flex-1">Conversations</TabsTrigger>
                      <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="conversations" className="mt-4 overflow-y-auto max-h-[calc(75vh-120px)]">
                      <ConversationList 
                        selectedConversationId={selectedConversationId} 
                        onSelectConversation={handleConversationSelect} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="search" className="mt-4">
                      <MessageSearch onSelectUser={handleUserSelect} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Right Side - Message Thread */}
        {(!isMobile || selectedConversationId) && (
          <div className="border rounded-md md:col-span-2 overflow-hidden flex flex-col h-full">
            <div className="flex-1 overflow-y-auto h-[calc(75vh-80px)]">
              <MessageThread conversationId={selectedConversationId} />
            </div>
            <ComposeMessage conversationId={selectedConversationId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
