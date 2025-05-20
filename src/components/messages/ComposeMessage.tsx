
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSendMessage } from '@/hooks/useMessages';

interface ComposeMessageProps {
  conversationId: string | null;
}

const ComposeMessage = ({ conversationId }: ComposeMessageProps) => {
  const [message, setMessage] = useState('');
  const { sendMessage, isSending } = useSendMessage(conversationId);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !conversationId) return;
    
    sendMessage(message);
    setMessage('');
  };
  
  return (
    <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending || !conversationId}
          className="flex-1"
          autoFocus
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!message.trim() || isSending || !conversationId}
          className="rounded-full"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  );
};

export default ComposeMessage;
