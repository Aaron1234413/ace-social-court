
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send } from 'lucide-react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      // Adjust textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setCurrentConversation(conversationId);
    loadMessages(conversationId);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
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
          <div className="bg-card rounded-lg border shadow-sm p-4">
            <h2 className="text-lg font-medium mb-3">Conversations</h2>
            <Button 
              variant="outline" 
              className="w-full mb-4" 
              onClick={handleStartNewConversation}
            >
              New Conversation
            </Button>
            <Separator className="mb-4" />
            <div className="space-y-2">
              {conversations.map(conversation => (
                <div 
                  key={conversation.id}
                  className={`p-2 rounded cursor-pointer text-sm hover:bg-accent ${currentConversation === conversation.id ? 'bg-accent' : ''}`}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">
                  No conversations yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat area - takes up most of the space */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border shadow-sm h-[70vh] flex flex-col">
            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                  <h3 className="text-lg font-medium mb-2">Tennis AI Assistant</h3>
                  <p className="mb-4">Ask me anything about tennis techniques, strategies, or training.</p>
                  <div className="max-w-md text-sm space-y-2">
                    <div className="bg-accent/30 p-3 rounded-lg">
                      "What's the proper technique for a one-handed backhand?"
                    </div>
                    <div className="bg-accent/30 p-3 rounded-lg">
                      "How should I approach playing on clay courts?"
                    </div>
                    <div className="bg-accent/30 p-3 rounded-lg">
                      "What exercises help improve serve power?"
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`mb-4 ${msg.is_from_ai ? '' : 'text-right'}`}>
                      <div className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
                        msg.is_from_ai 
                          ? 'bg-accent/30 text-left rounded-tl-none' 
                          : 'bg-primary text-primary-foreground rounded-tr-none'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about tennis techniques, strategies, or training..."
                  className="resize-none min-h-10 max-h-40"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !message.trim()}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TennisAI;
