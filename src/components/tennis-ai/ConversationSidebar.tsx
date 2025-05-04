
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

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
  isLoading?: boolean;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversation,
  handleConversationClick,
  handleStartNewConversation,
  handleDeleteConversation,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-medium mb-3">Conversations</h2>
        <Skeleton className="h-10 w-full mb-4" />
        <Separator className="mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-medium mb-3">Conversations</h2>
      <Button 
        variant="default" 
        className="mb-4 flex items-center"
        onClick={handleStartNewConversation}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        New Conversation
      </Button>
      <Separator className="mb-4" />
      
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <MessageSquare className="h-8 w-8 mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No conversations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start a new conversation to chat with the Tennis AI</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-3">
            {conversations.map(conversation => (
              <div 
                key={conversation.id}
                className={`rounded-lg border transition-all ${
                  currentConversation === conversation.id ? 'bg-accent border-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center p-2">
                  {/* Conversation title and date - clickable area */}
                  <div 
                    className="flex-1 p-2 cursor-pointer"
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <div className={`font-medium truncate ${currentConversation === conversation.id ? 'text-primary' : ''}`}>
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(conversation.created_at).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'  
                      })}
                    </div>
                  </div>
                  
                  {/* Delete button - always visible with improved design */}
                  {handleDeleteConversation && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ConversationSidebar;
