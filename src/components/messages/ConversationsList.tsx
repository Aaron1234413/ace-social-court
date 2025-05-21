import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/use-conversations';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import ConversationList from './ConversationList';

interface ConversationsListProps {
  currentConversationId?: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationsList = ({ 
  currentConversationId, 
  onSelectConversation 
}: ConversationsListProps) => {
  const navigate = useNavigate();
  const { conversations, isLoading, error, unreadCounts, deleteConversation, refetch } = useConversations();
  
  // Effect to set up realtime subscription (handled in the hook)
  useEffect(() => {
    // Initial fetch
    refetch();
    
    // Refresh every minute to keep timestamps current
    const intervalId = setInterval(() => {
      refetch();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [refetch]);
  
  const handleDeleteConversation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this conversation? This will hide all messages.')) {
      await deleteConversation(id);
      
      // If the deleted conversation was the current one, navigate back to messages
      if (id === currentConversationId) {
        navigate('/messages');
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center p-2 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-3 space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-medium">Failed to load conversations</h3>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={() => refetch()} size="sm" variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-4 space-y-4 h-full">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Avatar className="h-12 w-12">
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        </div>
        <h3 className="font-medium">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Start messaging with another user to begin a conversation
        </p>
      </div>
    );
  }
  
  return (
    <ConversationList 
      conversations={conversations}
      currentConversationId={currentConversationId}
      onSelectConversation={onSelectConversation}
      unreadCounts={unreadCounts}
      onDeleteConversation={handleDeleteConversation}
    />
  );
};

export default ConversationsList;
