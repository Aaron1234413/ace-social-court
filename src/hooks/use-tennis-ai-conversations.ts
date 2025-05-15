
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TennisAIConversation } from '@/components/tennis-ai/types';

interface UseConversationsOptions {
  userId: string | undefined;
  onError?: (error: { message: string; type?: string; retry?: () => void }) => void;
}

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

export const useTennisAIConversations = ({ userId, onError }: UseConversationsOptions) => {
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const realtimeChannelRef = useRef<any>(null);
  
  const loadConversations = async () => {
    try {
      console.log("Loading conversations from database...");
      
      if (!userId) {
        console.log("User is null, cannot load conversations");
        return [];
      }
      
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      
      console.log(`Loaded ${data?.length || 0} conversations:`, data);
      setConversations(data || []);

      // If there are conversations and no current conversation selected, select the most recent one
      if (data && data.length > 0 && !currentConversation) {
        console.log(`Selecting first conversation: ${data[0].id}`);
        setCurrentConversation(data[0].id);
        setLoadingMessages(true);
        loadMessages(data[0].id).finally(() => setLoadingMessages(false));
      } else if (data && data.length === 0 && currentConversation) {
        // If no conversations left but we have a current conversation ID
        // (this might happen after deleting the last conversation)
        console.log("No conversations left, resetting current conversation");
        setCurrentConversation(null);
        setMessages([]);
      }
      
      return data;
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
      if (onError) {
        onError({
          message: 'Failed to load conversations. Please try again.',
          retry: () => {
            setLoadingConversations(true);
            loadConversations().finally(() => setLoadingConversations(false));
          }
        });
      }
      return [];
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
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
      if (onError) {
        onError({
          message: 'Failed to load messages. Please try again.',
          retry: () => {
            setLoadingMessages(true);
            loadMessages(conversationId).finally(() => setLoadingMessages(false));
          }
        });
      }
      return [];
    }
  };

  const handleStartNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    if (onError) onError(null);
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

  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!userId || !id || !newTitle.trim()) return;
    
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

  const handleConversationClick = (conversationId: string) => {
    if (conversationId === currentConversation) return;
    
    setCurrentConversation(conversationId);
    setLoadingMessages(true);
    setMessages([]);
    if (onError) onError(null);
    loadMessages(conversationId).finally(() => setLoadingMessages(false));
  };

  // Set up real-time subscription for conversations
  useEffect(() => {
    if (!userId) return;
    
    console.log("Setting up realtime channel for conversations");
    
    const channel = supabase
      .channel(`tennis-ai-conversations-${userId}`)
      .on('postgres_changes', {
        event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'ai_conversations',
        filter: `user_id=eq.${userId}`
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
        
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('Conversation channel subscription failed, will retry');
        }
      });

    return () => {
      console.log('Removing conversation channel');
      supabase.removeChannel(channel);
    };
  }, [userId, currentConversation]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!currentConversation || !userId) return;
    
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
  }, [currentConversation, userId]);

  // Initial loading of conversations when userId is available
  useEffect(() => {
    if (userId) {
      setLoadingConversations(true);
      loadConversations().finally(() => setLoadingConversations(false));
    }
  }, [userId]);

  return {
    currentConversation,
    setCurrentConversation,
    conversations,
    messages,
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
  };
};
