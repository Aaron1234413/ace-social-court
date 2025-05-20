
import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, ThumbsUp, Heart, Laugh, Frown } from 'lucide-react';
import { Message, MessageReaction } from '@/components/messages/types';
import MessageMedia from './MessageMedia';
import MessageActions from './MessageActions';
import { useAuth } from '@/components/AuthProvider';

interface MessageGroupProps {
  messages: Message[];
  isCurrentUser: boolean;
  handleMessageClick: (messageId: string) => void;
  selectedMessage: string | null;
  onAddReaction: (messageId: string, type: MessageReaction['reaction_type']) => void;
  onRemoveReaction: (messageId: string, reactionId: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

const MessageGroup = ({
  messages,
  isCurrentUser,
  handleMessageClick,
  selectedMessage,
  onAddReaction,
  onRemoveReaction,
  onDeleteMessage
}: MessageGroupProps) => {
  const { user } = useAuth();
  
  if (messages.length === 0) return null;
  
  return (
    <div 
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div 
        className={`flex items-start gap-2 max-w-[80%] ${
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Only show avatar once per group */}
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0 border-2 border-tennis-green/20">
          {messages[0].sender?.avatar_url && (
            <img 
              src={messages[0].sender.avatar_url} 
              alt={messages[0].sender?.username || 'User'} 
            />
          )}
          <AvatarFallback className={isCurrentUser ? "bg-tennis-green text-white" : "bg-tennis-green/10 text-tennis-darkGreen"}>
            {isCurrentUser 
              ? user?.email?.charAt(0).toUpperCase() || 'Y'
              : messages[0].sender?.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          {messages.map((message, msgIndex) => {
            const isFirstInGroup = msgIndex === 0;
            const isLastInGroup = msgIndex === messages.length - 1;
            const isDeleted = message.is_deleted;
            
            // Determine border radius based on position in group
            let borderRadiusClass = 'rounded-xl';
            if (isCurrentUser) {
              if (messages.length > 1) {
                if (isFirstInGroup) borderRadiusClass = 'rounded-xl rounded-br-sm';
                else if (isLastInGroup) borderRadiusClass = 'rounded-xl rounded-tr-sm';
                else borderRadiusClass = 'rounded-xl rounded-r-sm';
              } else {
                borderRadiusClass = 'rounded-xl rounded-br-none';
              }
            } else {
              if (messages.length > 1) {
                if (isFirstInGroup) borderRadiusClass = 'rounded-xl rounded-bl-sm';
                else if (isLastInGroup) borderRadiusClass = 'rounded-xl rounded-tl-sm';
                else borderRadiusClass = 'rounded-xl rounded-l-sm';
              } else {
                borderRadiusClass = 'rounded-xl rounded-bl-none';
              }
            }
            
            // Get all reactions for this message
            const messageReactions = message.reactions || [];
            
            return (
              <div key={message.id} className="space-y-1">
                <div 
                  className={`${borderRadiusClass} ${
                    isCurrentUser 
                      ? 'bg-tennis-green text-white shadow-sm' 
                      : 'bg-tennis-green/10 text-tennis-darkGreen'
                  } ${selectedMessage === message.id ? 'ring-2 ring-offset-2 ring-tennis-blue' : ''}`}
                  onClick={() => handleMessageClick(message.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleMessageClick(message.id);
                    }
                  }}
                >
                  {/* Message with media */}
                  {message.media_url && message.media_type && !isDeleted && (
                    <div className="mb-1">
                      <MessageMedia
                        url={message.media_url} 
                        type={message.media_type}
                      />
                    </div>
                  )}
                  
                  {/* Message text */}
                  {(!isDeleted || message.content) && (
                    <div className={`px-4 py-2 ${isDeleted ? 'italic text-opacity-70' : ''}`}>
                      <p>{message.content}</p>
                    </div>
                  )}
                </div>
                
                {/* Message actions and reactions */}
                <div className={`flex items-center gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <MessageActions 
                    messageId={message.id}
                    senderId={message.sender_id}
                    reactions={messageReactions}
                    onAddReaction={onAddReaction}
                    onRemoveReaction={onRemoveReaction}
                    onDelete={onDeleteMessage}
                  />
                  
                  {/* Only show time and read receipt for last message in a group */}
                  {isLastInGroup && (
                    <div className={`flex items-center text-xs text-muted-foreground ${isCurrentUser ? 'justify-end' : 'justify-start'} px-1`}>
                      <span>{format(new Date(message.created_at), 'h:mm a')}</span>
                      {isCurrentUser && message.read && (
                        <Check className="h-3 w-3 ml-1 text-tennis-blue" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* Display reactions if any */}
                {messageReactions.length > 0 && (
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex bg-background rounded-full border border-tennis-green/10 px-2 py-0.5 gap-1">
                      {Object.entries(messageReactions.reduce((acc, reaction) => {
                        acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map(([type, count]) => (
                        <div key={type} className="flex items-center text-xs">
                          {type === 'like' && <ThumbsUp className="h-3 w-3 text-tennis-blue mr-1" />}
                          {type === 'heart' && <Heart className="h-3 w-3 text-red-500 mr-1" />}
                          {type === 'laugh' && <Laugh className="h-3 w-3 text-yellow-500 mr-1" />}
                          {type === 'sad' && <Frown className="h-3 w-3 text-blue-500 mr-1" />}
                          {count}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageGroup;
