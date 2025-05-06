
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConversations } from '@/hooks/use-messages';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquarePlus } from 'lucide-react';
import NewMessageDialog from './NewMessageDialog';
import { ErrorAlert } from '@/components/ui/error-alert';

interface ConversationsListProps {
  selectedUserId?: string | null;
  onError?: (error: string) => void;
  onSelectConversation?: (userId: string) => void;
}

const ConversationsList = ({ selectedUserId, onError, onSelectConversation }: ConversationsListProps) => {
  const { conversations, isLoadingConversations, error, refetch } = useConversations();
  const navigate = useNavigate();
  const location = useLocation();
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  console.log("ConversationsList - selectedUserId:", selectedUserId);
  console.log("ConversationsList - available conversations:", conversations.map(c => c.other_user?.id));

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error.message);
    }
  }, [error, onError]);

  // Force refresh when conversations-refresh event is triggered
  useEffect(() => {
    const handleRefresh = () => {
      console.log("Conversations list refresh triggered");
      refetch();
    };

    window.addEventListener('conversations-refresh', handleRefresh);
    return () => {
      window.removeEventListener('conversations-refresh', handleRefresh);
    };
  }, [refetch]);

  const handleConversationClick = (userId: string | undefined) => {
    if (!userId) return;
    
    console.log("Conversation clicked:", userId);
    
    if (onSelectConversation) {
      onSelectConversation(userId);
    } else {
      // Fallback to direct navigation if no handler provided
      navigate(`/messages/${userId}`, { replace: location.pathname.includes(userId) });
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <ErrorAlert
          title="Failed to load conversations"
          message={error.message}
          severity="error"
          onRetry={() => refetch()}
        />
        <Button 
          variant="outline" 
          className="w-full gap-2 mt-4" 
          onClick={() => setNewMessageOpen(true)}
        >
          <MessageSquarePlus className="h-4 w-4" />
          Start New Message
        </Button>
        
        <NewMessageDialog 
          open={newMessageOpen} 
          onOpenChange={setNewMessageOpen}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        className="w-full gap-2" 
        onClick={() => setNewMessageOpen(true)}
      >
        <MessageSquarePlus className="h-4 w-4" />
        New Message
      </Button>
      
      <NewMessageDialog 
        open={newMessageOpen} 
        onOpenChange={setNewMessageOpen}
        onError={onError}
      />
      
      {conversations.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No conversations yet
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conversation) => {
            // Check if this conversation is currently selected - convert both to strings for consistent comparison
            const isSelected = String(selectedUserId) === String(conversation.other_user?.id);
            
            console.log(
              `Conversation with ${conversation.other_user?.username}:`, 
              `selected=${isSelected}`,
              `(selected=${selectedUserId}, this=${conversation.other_user?.id})`
            );
            
            const hasUnread = conversation.last_message && 
              !conversation.last_message.read && 
              conversation.last_message.sender_id !== conversation.other_user?.id;

            return (
              <button
                key={conversation.id}
                className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
                  isSelected 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleConversationClick(conversation.other_user?.id)}
                aria-selected={isSelected}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {conversation.other_user?.avatar_url && (
                    <img 
                      src={conversation.other_user.avatar_url} 
                      alt={conversation.other_user?.username || 'User'} 
                    />
                  )}
                  <AvatarFallback>
                    {conversation.other_user?.full_name?.charAt(0) || 
                     conversation.other_user?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <p className={`font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                      {conversation.other_user?.full_name || 
                       conversation.other_user?.username || 'Unknown User'}
                    </p>
                    {conversation.last_message_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {conversation.last_message && (
                    <p className={`text-sm truncate ${hasUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                      {conversation.last_message.content}
                    </p>
                  )}
                </div>
                
                {hasUnread && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConversationsList;
