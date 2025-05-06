
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCreateConversation } from '@/hooks/use-messages';
import { MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MessageButtonProps {
  userId: string;
  compact?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
}

const MessageButton = ({ userId, compact = false, variant = 'outline' }: MessageButtonProps) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const { createConversation } = useCreateConversation();
  
  const handleClick = async () => {
    if (isCreating || !userId) return;
    
    try {
      setIsCreating(true);
      console.log(`Starting conversation with user: ${userId}`);
      
      // First, try to navigate directly. This will work if the conversation already exists
      navigate(`/messages/${userId}`);
      
      // Then try to create the conversation in case it doesn't exist yet
      createConversation(userId, {
        onSuccess: (data) => {
          console.log("Conversation created successfully");
          // We're already navigating above, so no need to navigate again here
        },
        onError: (error) => {
          console.error('Error creating conversation:', error);
          
          if (error instanceof Error && 
             (error.message.includes('duplicate key') || 
              error.message.includes('constraint'))) {
            
            console.log("Conversation already exists, already navigated to it.");
            // No need to navigate again, we did it above
          } else {
            // Only show error for non-duplicate key errors
            toast.error("Failed to start conversation", {
              description: error instanceof Error ? error.message : "Please try again later"
            });
          }
        },
        onSettled: () => {
          setIsCreating(false);
        }
      });
    } catch (error) {
      console.error('Unexpected error in MessageButton:', error);
      setIsCreating(false);
      toast.error("An unexpected error occurred");
    }
  };
  
  return (
    <Button
      variant={variant}
      size={compact ? 'icon' : 'sm'}
      onClick={handleClick}
      disabled={isCreating}
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : compact ? (
        <MessageSquare className="h-4 w-4" />
      ) : (
        <>
          <MessageSquare className="h-4 w-4 mr-2" />
          Message
        </>
      )}
    </Button>
  );
};

export default MessageButton;
