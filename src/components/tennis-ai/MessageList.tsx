
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  is_from_ai: boolean;
  created_at: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
        <h3 className="text-lg font-medium mb-2">Tennis AI Assistant</h3>
        <p className="mb-4">Ask me anything about tennis techniques, strategies, or training.</p>
        <div className="max-w-md text-sm space-y-2">
          <div className="bg-accent/30 p-3 rounded-lg">
            "What's the proper technique for a one-handed backhand?"
          </div>
          <div className="bg-accent/30 p-3 rounded-lg">
            "How should I approach playing on clay courts?"
          </div>
          <div className="bg-accent/30 p-3 rounded-lg">
            "What exercises help improve serve power?"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className={`mb-4 ${msg.is_from_ai ? '' : 'text-right'}`}>
          <div className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
            msg.is_from_ai 
              ? 'bg-accent/30 text-left rounded-tl-none' 
              : 'bg-primary text-primary-foreground rounded-tr-none'
          }`}>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="mb-4">
          <div className="inline-block max-w-[80%] px-4 py-2 rounded-lg bg-accent/30 text-left rounded-tl-none">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
