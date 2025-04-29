
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import ConversationsList from '@/components/messages/ConversationsList';
import ChatInterface from '@/components/messages/ChatInterface';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: selectedUserId } = useParams<{ id: string }>();
  
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
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Messages</h1>
      
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
        
        {/* Chat Interface */}
        <div className={`border rounded-md overflow-hidden ${
          selectedUserId ? 'block md:col-span-2' : 'hidden md:block md:col-span-2'
        }`}>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default Messages;
