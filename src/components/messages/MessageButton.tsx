
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCreateConversation } from '@/hooks/use-messages';
import { MessageSquare } from 'lucide-react';

interface MessageButtonProps {
  userId: string;
  compact?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
}

const MessageButton = ({ userId, compact = false, variant = 'outline' }: MessageButtonProps) => {
  const navigate = useNavigate();
  const { createConversation, isCreating } = useCreateConversation();
  
  const handleClick = () => {
    createConversation(userId, {
      onSuccess: () => {
        navigate(`/messages/${userId}`);
      }
    });
  };
  
  return (
    <Button
      variant={variant}
      size={compact ? 'icon' : 'sm'}
      onClick={handleClick}
      disabled={isCreating}
    >
      {compact ? (
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
