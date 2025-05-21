
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Conversation } from '@/components/messages/types';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null | undefined;
  onSelectConversation: (id: string) => void;
  unreadCounts?: Record<string, number>;
  onDeleteConversation?: (id: string) => void;
}

const ConversationList = ({ 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  unreadCounts = {},
  onDeleteConversation
}: ConversationListProps) => {
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const isActive = currentConversationId === conversation.id;
        const unreadCount = unreadCounts[conversation.id] || 0;
        const hasUnread = unreadCount > 0;
        
        return (
          <div 
            key={conversation.id} 
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
              isActive 
                ? 'bg-accent/50' 
                : hasUnread 
                  ? 'bg-primary/5 hover:bg-accent/30' 
                  : 'hover:bg-accent/30'
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
              {conversation.other_user?.avatar_url ? (
                <AvatarImage src={conversation.other_user.avatar_url} />
              ) : (
                <AvatarFallback>
                  {conversation.other_user?.username?.charAt(0) || 
                   conversation.other_user?.full_name?.charAt(0) || 
                   '?'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className={`text-sm font-medium truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-foreground'}`}>
                  {conversation.other_user?.full_name || 
                   conversation.other_user?.username || 
                   'Unknown User'}
                </h4>
                
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {conversation.last_message_at
                    ? formatDistanceToNow(new Date(conversation.last_message_at), { 
                        addSuffix: false,
                        includeSeconds: true
                      })
                    : ''}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className={`text-xs truncate max-w-[150px] ${
                  hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {conversation.last_message?.content || 'No messages yet'}
                </p>
                
                {hasUnread && (
                  <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </div>
            
            {onDeleteConversation && (
              <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteConversation(conversation.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
