
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
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      console.log(`Starting conversation with user: ${userId}`);
      
      createConversation(userId, {
        onSuccess: () => {
          navigate(`/messages/${userId}`);
        },
        onError: (error) => {
          console.error('Error creating conversation:', error);
          
          // Check if error is due to duplicate key (conversation already exists)
          if (error instanceof Error && 
              error.message.includes('duplicate key') || 
              error.message.includes('constraint')) {
            
            console.log("Conversation already exists, navigating to it...");
            // If conversation already exists, just navigate to it
            navigate(`/messages/${userId}`);
          } else {
            // Show error for other types of errors
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
      
      // Try to navigate anyway as a fallback
      navigate(`/messages/${userId}`);
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
