
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle, MessageSquare, MoreVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
                className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-accent group relative ${
                  currentConversation === conversation.id ? 'bg-accent shadow-sm' : 'hover:shadow-sm'
                }`}
              >
                <div 
                  className="flex justify-between items-center"
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <div className="truncate flex-1">
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
                  
                  {handleDeleteConversation && (
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                      {/* Mobile-friendly always visible delete button */}
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 md:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                        <span className="sr-only">Delete conversation</span>
                      </Button>
                      
                      {/* Desktop hover-to-reveal delete button */}
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                        <span className="sr-only">Delete conversation</span>
                      </Button>
                      
                      {/* Alternative dropdown for more actions (can be expanded later) */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive flex items-center cursor-pointer"
                            onClick={() => handleDeleteConversation(conversation.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
