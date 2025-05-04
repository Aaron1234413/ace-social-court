
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle, MessageSquare, Pencil } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TennisAIConversation } from './types';

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
  handleRenameConversation?: (id: string, newTitle: string) => void;
  isLoading?: boolean;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversation,
  handleConversationClick,
  handleStartNewConversation,
  handleDeleteConversation,
  handleRenameConversation,
  isLoading = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const saveTitle = (id: string) => {
    if (handleRenameConversation && editTitle.trim()) {
      handleRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  // Format conversation titles to be more concise
  const formatTitle = (title: string) => {
    // If title is already short, return it
    if (title.length < 25) return title;
    
    // Check if it starts with common AI conversation beginnings
    if (title.toLowerCase().startsWith("hi there") || 
        title.toLowerCase().startsWith("hello") || 
        title.toLowerCase().startsWith("hey")) {
      return "Tennis Conversation";
    }
    
    // Extract key topics by looking for keywords like backhand, forehand, serve, etc.
    const tennisTerms = ["backhand", "forehand", "serve", "volley", "smash", "tennis", "stroke", "technique", "training"];
    for (const term of tennisTerms) {
      if (title.toLowerCase().includes(term)) {
        return `${term.charAt(0).toUpperCase() + term.slice(1)} Discussion`;
      }
    }
    
    // Default fallback - take first few words
    return title.split(' ').slice(0, 3).join(' ') + '...';
  };

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
                {editingId === conversation.id ? (
                  <div className="p-2 flex">
                    <Input 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle(conversation.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      className="ml-2"
                      onClick={() => saveTitle(conversation.id)}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="p-2">
                    {/* Clickable area for selecting conversation */}
                    <div 
                      className="cursor-pointer p-2"
                      onClick={() => handleConversationClick(conversation.id)}
                    >
                      <div className={`font-medium truncate ${currentConversation === conversation.id ? 'text-primary' : ''}`}>
                        {formatTitle(conversation.title)}
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

                    {/* Actions row with edit and delete buttons */}
                    <div className="flex justify-end mt-1 space-x-2">
                      {handleRenameConversation && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(conversation);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Rename</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rename conversation</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {handleDeleteConversation && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(conversation.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete conversation</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ConversationSidebar;
