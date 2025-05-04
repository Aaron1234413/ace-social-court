
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MessageList from '@/components/tennis-ai/MessageList';
import MessageInput from '@/components/tennis-ai/MessageInput';
import ConversationSidebar from '@/components/tennis-ai/ConversationSidebar';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      console.log("User not authenticated, redirecting to auth page");
      navigate('/auth');
    } else {
      loadConversations();
    }
  }, [user, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setConversations(data || []);

      // If there are conversations and no current conversation selected, select the most recent one
      if (data && data.length > 0 && !currentConversation) {
        setCurrentConversation(data[0].id);
        loadMessages(data[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleStartNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !user) return;

    try {
      setIsLoading(true);
      
      // Optimistically add the message to the UI
      const optimisticUserMessage = {
        id: 'temp-' + Date.now(),
        content: message,
        is_from_ai: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticUserMessage]);
      setMessage('');

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('tennis-ai-chat', {
        body: {
          conversationId: currentConversation,
          message: message.trim(),
          userId: user.id
        }
      });

      if (error) throw error;

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setCurrentConversation(conversationId);
    loadMessages(conversationId);
  };

  if (!user) {
    return <div className="p-8 text-center">Please sign in to use the Tennis AI</div>;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tennis AI Assistant</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversation sidebar - visible on desktop only */}
        <div className="hidden lg:block">
          <ConversationSidebar 
            conversations={conversations}
            currentConversation={currentConversation}
            handleConversationClick={handleConversationClick}
            handleStartNewConversation={handleStartNewConversation}
          />
        </div>

        {/* Chat area - takes up most of the space */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border shadow-sm h-[70vh] flex flex-col">
            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-4">
              <MessageList messages={messages} isLoading={isLoading} />
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t p-4">
              <MessageInput
                message={message}
                setMessage={setMessage}
                handleSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TennisAI;
