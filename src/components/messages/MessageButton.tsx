
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
      
      // First, navigate directly to the messages route with this user ID
      navigate(`/messages/${userId}`);
      
      // Then attempt to create a conversation record if it doesn't exist yet
      createConversation(userId, {
        onSuccess: () => {
          console.log("Conversation created or found successfully");
        },
        onError: (error) => {
          // Only show errors for non-duplicate key issues
          // (duplicate errors are expected since we may already have this conversation)
          if (error instanceof Error && 
             !(error.message.includes('duplicate key') || 
               error.message.includes('constraint'))) {
            
            toast.error("Failed to create conversation", {
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
