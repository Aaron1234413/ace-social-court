
import React, { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  message, 
  setMessage, 
  handleSendMessage, 
  isLoading 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on component mount and after messages are sent
  useEffect(() => {
    if (textareaRef.current && !isLoading) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        handleSendMessage(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask about tennis techniques, strategies, or training..."
        className="resize-none min-h-[50px] max-h-[150px] rounded-xl"
        disabled={isLoading}
      />
      <Button 
        type="submit" 
        size="icon" 
        className="rounded-full h-10 w-10 flex-shrink-0"
        disabled={isLoading || !message.trim()}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
};

export default MessageInput;
