
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversation: string | null;
  handleConversationClick: (id: string) => void;
  handleStartNewConversation: () => void;
  handleDeleteConversation?: (id: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversation,
  handleConversationClick,
  handleStartNewConversation,
  handleDeleteConversation
}) => {
  return (
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
            className={`p-2 rounded cursor-pointer text-sm hover:bg-accent group relative ${currentConversation === conversation.id ? 'bg-accent' : ''}`}
          >
            <div 
              className="flex justify-between items-center"
              onClick={() => handleConversationClick(conversation.id)}
            >
              <div className="truncate flex-1">
                <div className="font-medium truncate">{conversation.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(conversation.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {handleDeleteConversation && (
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Delete conversation</span>
                </Button>
              )}
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
  );
};

export default ConversationSidebar;
