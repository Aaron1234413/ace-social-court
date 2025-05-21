
import React from 'react';
import { useConversations } from '@/hooks/use-conversations';
import { Conversation } from '@/components/messages/types';
import { Loading } from '@/components/ui/loading';
import ConversationList from './ConversationList';

interface ConversationsListProps {
  onSelectConversation: (userId: string) => void;
  currentConversationId?: string;
}

const ConversationsList = ({ 
  onSelectConversation, 
  currentConversationId 
}: ConversationsListProps) => {
  const { 
    conversations, 
    isLoading,
    unreadCounts,
    deleteConversation
  } = useConversations();

  if (isLoading) {
    return <Loading text="Loading conversations..." />;
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <p className="text-center">No conversations yet</p>
      </div>
    );
  }

  // Cast conversations to Conversation[] to ensure type compatibility
  return (
    <ConversationList
      conversations={conversations as Conversation[]}
      currentConversationId={currentConversationId}
      onSelectConversation={onSelectConversation}
      unreadCounts={unreadCounts}
      onDeleteConversation={deleteConversation}
    />
  );
};

export default ConversationsList;
