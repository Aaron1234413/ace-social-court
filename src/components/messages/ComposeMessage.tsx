
import { useState } from 'react';
import { Send, Image, Smile, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMessages } from '@/hooks/useMessages';

interface ComposeMessageProps {
  conversationId: string | null;
}

const ComposeMessage = ({ conversationId }: ComposeMessageProps) => {
  const [message, setMessage] = useState('');
  const { 
    sendMessage, 
    isSending, 
    newMessage, 
    setNewMessage,
    handleMediaSelect,
    mediaPreview,
    clearMedia
  } = useMessages(conversationId);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !mediaPreview) || !conversationId) return;
    
    setNewMessage(message);
    sendMessage();
    setMessage('');
  };
  
  const triggerFileInput = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        handleMediaSelect(file, 'image');
      }
    };
    fileInput.click();
  };
  
  return (
    <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
      {mediaPreview && (
        <div className="relative mb-2 inline-block">
          <img 
            src={mediaPreview} 
            alt="Media preview" 
            className="h-20 rounded-md object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
            onClick={clearMedia}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove image</span>
          </Button>
        </div>
      )}
      
      <div className="flex gap-2 items-center">
        <div className="flex-none flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                onClick={triggerFileInput}
                disabled={isSending || !conversationId}
              >
                <Image className="h-5 w-5" />
                <span className="sr-only">Add image</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add image</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                disabled={isSending || !conversationId}
              >
                <Smile className="h-5 w-5" />
                <span className="sr-only">Add emoji</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add emoji</TooltipContent>
          </Tooltip>
        </div>
        
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending || !conversationId}
          className="flex-1 bg-accent/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          autoFocus
        />
        
        <Button 
          type="submit" 
          size="icon" 
          disabled={(!message.trim() && !mediaPreview) || isSending || !conversationId}
          className="rounded-full h-9 w-9 bg-primary hover:bg-primary/90"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  );
};

export default ComposeMessage;
