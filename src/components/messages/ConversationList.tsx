
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Conversation } from '@/components/messages/types';
import { MoreHorizontal, Trash } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (userId: string) => void;
  unreadCounts: Record<string, number>;
  onDeleteConversation: (conversationId: string) => void;
}

const ConversationList = ({ 
  conversations, 
  currentConversationId, 
  onSelectConversation, 
  unreadCounts,
  onDeleteConversation 
}: ConversationListProps) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <p>No conversations yet.</p>
        <p className="mt-1">Search for users to start chatting.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1 p-2">
      {conversations.map(conversation => {
        const otherUserId = conversation.other_user?.id || '';
        const isSelected = currentConversationId === otherUserId;
        const unreadCount = unreadCounts[otherUserId] || 0;
        const hasUnread = unreadCount > 0;
        
        return (
          <div 
            key={conversation.id}
            className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
              isSelected 
                ? 'bg-primary/10 border border-primary/30' 
                : 'hover:bg-accent border border-transparent'
            }`}
          >
            <div 
              className="flex-grow flex items-center gap-3 cursor-pointer"
              onClick={() => onSelectConversation(otherUserId)}
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
                      {unreadCount > 1 ? unreadCount : 'new'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md hover:bg-accent">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDeleteConversation(conversation.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
