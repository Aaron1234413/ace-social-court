
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useConversations } from '@/hooks/useConversations';

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (userId: string) => void;
}

const ConversationList = ({ selectedConversationId, onSelectConversation }: ConversationListProps) => {
  const { conversations, isLoading, error } = useConversations();
  
  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-sm text-red-500">
        Error loading conversations. Please try again.
      </div>
    );
  }
  
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No conversations yet.
        <p className="mt-1">Search for users to start chatting.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1 p-2">
      {conversations.map(conversation => {
        const isSelected = selectedConversationId === conversation.other_user?.id;
        const hasUnread = conversation.last_message && 
                          !conversation.last_message.read && 
                          conversation.last_message.sender_id === conversation.other_user?.id;
                          
        return (
          <button
            key={conversation.id}
            className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
              isSelected 
                ? 'bg-primary/10 border border-primary/30' 
                : 'hover:bg-accent border border-transparent'
            }`}
            onClick={() => onSelectConversation(conversation.other_user?.id as string)}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              {conversation.other_user?.avatar_url && (
                <img 
                  src={conversation.other_user.avatar_url} 
                  alt={conversation.other_user?.username || 'User'} 
                  className="h-full w-full object-cover"
                />
              )}
              <AvatarFallback>
                {conversation.other_user?.full_name?.charAt(0) || 
                 conversation.other_user?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-baseline">
                <p className="font-medium truncate">
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
                  <p className={`text-sm truncate ${hasUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                    {conversation.last_message.content}
                  </p>
                )}
                
                {hasUnread && (
                  <Badge variant="default" className="ml-1 py-0 px-1.5 text-xs h-5">
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
};

export default ConversationList;
