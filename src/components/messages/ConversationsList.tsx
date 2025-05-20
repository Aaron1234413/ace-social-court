
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConversations } from '@/hooks/use-messages';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquarePlus, Eye } from 'lucide-react';
import NewMessageDialog from './NewMessageDialog';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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

  const handleConversationClick = useCallback((userId: string | undefined) => {
    if (!userId) return;
    
    console.log("Conversation clicked:", userId);
    
    if (onSelectConversation) {
      onSelectConversation(userId);
    } else {
      // Fallback to direct navigation if no handler provided
      navigate(`/messages/${userId}`);
    }
  }, [onSelectConversation, navigate]);
  
  // Memoize the rendering of conversations to prevent unnecessary re-renders
  const renderConversations = useMemo(() => {
    if (conversations.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-tennis-green/10 flex items-center justify-center mb-4">
              <MessageSquarePlus className="h-8 w-8 text-tennis-green opacity-60" />
            </div>
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Start a new message to connect</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {conversations.map((conversation) => {
          // Convert both IDs to strings for consistent comparison
          const isSelected = selectedUserId === conversation.other_user?.id;
          
          console.log(
            `Conversation with ${conversation.other_user?.username}:`, 
            `selected=${isSelected}`,
            `(selected=${selectedUserId}, this=${conversation.other_user?.id})`
          );
          
          // Check if there are unread messages (last message is not read and was sent by the other user)
          const hasUnread = conversation.last_message && 
                           !conversation.last_message.read && 
                           conversation.last_message.sender_id === conversation.other_user?.id;

          return (
            <button
              key={conversation.id}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                isSelected 
                  ? 'bg-tennis-green/20 border border-tennis-green/40' 
                  : 'hover:bg-tennis-green/10 border border-transparent'
              }`}
              onClick={() => handleConversationClick(conversation.other_user?.id)}
              aria-selected={isSelected}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-tennis-green/20">
                  {conversation.other_user?.avatar_url && (
                    <img 
                      src={conversation.other_user.avatar_url} 
                      alt={conversation.other_user?.username || 'User'} 
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-tennis-green/20 text-tennis-darkGreen">
                    {conversation.other_user?.full_name?.charAt(0) || 
                     conversation.other_user?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-tennis-accent rounded-full flex items-center justify-center border-2 border-white">
                    <Eye className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                  <p className={`font-medium truncate ${isSelected ? 'text-tennis-darkGreen' : ''}`}>
                    {conversation.other_user?.full_name || 
                     conversation.other_user?.username || 'Unknown User'}
                  </p>
                  {conversation.last_message_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  {conversation.last_message && (
                    <p className={`text-sm truncate ${hasUnread ? 'font-medium text-tennis-darkGreen' : 'text-muted-foreground'}`}>
                      {conversation.last_message.content}
                    </p>
                  )}
                  
                  {hasUnread && (
                    <Badge variant="default" className="ml-1 py-0 px-1.5 text-xs h-5 bg-tennis-accent text-white">
                      new
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }, [conversations, selectedUserId, handleConversationClick]);

  // Handle loading state
  if (isLoadingConversations) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle error state with retry capability
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
          className="w-full gap-2 mt-4 border-tennis-green/20 hover:bg-tennis-green/10 text-tennis-darkGreen" 
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
        className="w-full gap-2 border-tennis-green/20 bg-gradient-to-r from-white to-[#F2FCE2] hover:bg-tennis-green/10 text-tennis-darkGreen" 
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
      
      {renderConversations}
    </div>
  );
};

export default memo(ConversationsList);
