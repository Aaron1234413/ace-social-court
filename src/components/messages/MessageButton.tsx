
import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCreateConversation } from '@/hooks/use-create-conversation'; // Updated import path
import { MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageButtonProps {
  userId: string;
  compact?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
}

const MessageButton = ({ userId, compact = false, variant = 'outline' }: MessageButtonProps) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const { createConversation } = useCreateConversation();
  const isMobile = useIsMobile();
  
  const handleClick = useCallback(async () => {
    if (isCreating || !userId) return;
    
    try {
      setIsCreating(true);
      console.log(`Starting conversation with user: ${userId}`);
      
      // Navigate to the messages route with this user ID and pass the referrer to preserve context
      navigate(`/messages/${userId}`, {
        state: { 
          fromSearch: true,
          previousPath: window.location.pathname + window.location.search
        }
      });
      
      // Then attempt to create a conversation record if it doesn't exist yet
      createConversation(userId, {
        onSuccess: () => {
          console.log("Conversation created or found successfully");
          if (isMobile) {
            // On mobile, show a toast to confirm
            toast.success("Conversation opened", {
              description: "You can now start messaging"
            });
          }
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
  }, [userId, isCreating, navigate, createConversation, isMobile]);
  
  // On mobile, use a more compact button when compact prop is true
  const buttonSize = isMobile && compact ? 'icon' : compact ? 'icon' : 'sm';
  
  return (
    <Button
      variant={variant}
      size={buttonSize}
      onClick={handleClick}
      disabled={isCreating}
      className={compact ? 'rounded-full' : 'rounded-md'}
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

export default memo(MessageButton);
