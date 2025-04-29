
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/use-messages';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const ConversationsList = ({ selectedUserId }: { selectedUserId?: string }) => {
  const { conversations, isLoadingConversations } = useConversations();
  const navigate = useNavigate();

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

  if (conversations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const isSelected = selectedUserId === conversation.other_user?.id;
        const hasUnread = conversation.last_message && 
          !conversation.last_message.read && 
          conversation.last_message.recipient_id === conversation.other_user?.id;

        return (
          <button
            key={conversation.id}
            className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
              isSelected 
                ? 'bg-primary/10' 
                : 'hover:bg-accent'
            }`}
            onClick={() => navigate(`/messages/${conversation.other_user?.id}`)}
          >
            <Avatar className="h-10 w-10">
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
  );
};

export default ConversationsList;
