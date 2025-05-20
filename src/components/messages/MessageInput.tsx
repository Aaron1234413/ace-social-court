
import React, { useRef } from 'react';
import { Send, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: () => void;
  isSending: boolean;
  mediaPreview: string | null;
  mediaType: 'image' | 'video' | null;
  uploadProgress: number;
  clearMedia: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: (type: 'image' | 'video') => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

const MessageInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  isSending,
  mediaPreview,
  mediaType,
  uploadProgress,
  clearMedia,
  onFileSelect,
  triggerFileInput,
  handleKeyDown
}: MessageInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="border-t border-tennis-green/20 p-4 bg-white/70 backdrop-blur-sm rounded-b-lg sticky bottom-0 z-10">
      {mediaPreview && (
        <div className="px-2 pb-2">
          <div className="relative bg-tennis-green/5 rounded-md p-2 flex items-center border border-tennis-green/20">
            {mediaType === 'image' ? (
              <img 
                src={mediaPreview} 
                alt="Upload preview" 
                className="h-16 object-cover rounded-md" 
              />
            ) : (
              <video 
                src={mediaPreview} 
                className="h-16 object-cover rounded-md"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-muted-foreground hover:text-destructive"
              onClick={clearMedia}
            >
              Remove
            </Button>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 px-2">
                <Progress 
                  value={uploadProgress} 
                  className="h-1 bg-gray-200" 
                />
              </div>
            )}
          </div>
        </div>
      )}
    
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 border-tennis-green/20 focus-visible:ring-tennis-green/30 focus-visible:ring-offset-tennis-green/10"
            ref={inputRef}
            aria-label="Message input"
          />
          <Button 
            type="submit"
            size="icon"
            disabled={(!newMessage.trim() && !mediaPreview) || isSending}
            className="rounded-full h-10 w-10 bg-tennis-green hover:bg-tennis-darkGreen text-white"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => triggerFileInput('image')}
            disabled={isSending}
            className="rounded-md h-8 px-2 text-xs flex gap-1 text-tennis-darkGreen hover:bg-tennis-green/10"
          >
            <ImageIcon className="h-3 w-3" />
            Add image
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => triggerFileInput('video')}
            disabled={isSending}
            className="rounded-md h-8 px-2 text-xs flex gap-1 text-tennis-darkGreen hover:bg-tennis-green/10"
          >
            <Video className="h-3 w-3" />
            Add video
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            onChange={onFileSelect}
          />
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
