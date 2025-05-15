
import React, { useRef } from 'react';
import ErrorBoundary from '@/components/tennis-ai/ErrorBoundary';
import MessageList from '@/components/tennis-ai/MessageList';
import MessageInput from '@/components/tennis-ai/MessageInput';
import { Loading } from '@/components/ui/loading';

interface ChatContainerProps {
  messages: any[];
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isLoading: boolean;
  isReconnecting: boolean;
  loadingMessages: boolean;
  apiError: { message: string; type?: string; retry?: () => void } | null;
  onApiErrorReset: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  message,
  setMessage,
  handleSendMessage,
  isLoading,
  isReconnecting,
  loadingMessages,
  apiError,
  onApiErrorReset
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-card rounded-lg border shadow-sm h-[70vh] flex flex-col">
      {/* Chat history */}
      <ErrorBoundary onReset={onApiErrorReset}>
        <div className="flex-1 overflow-y-auto p-4">
          {isReconnecting ? (
            <div className="h-full flex items-center justify-center">
              <Loading 
                variant="spinner" 
                text="Reconnecting..." 
                className="max-w-md mx-auto"
              />
            </div>
          ) : (
            <MessageList 
              messages={messages} 
              isLoading={isLoading || loadingMessages}
              error={apiError}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </ErrorBoundary>

      {/* Message input */}
      <div className="border-t p-4">
        <MessageInput
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading || isReconnecting}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
