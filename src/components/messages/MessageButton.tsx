
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useCreateConversation } from '@/hooks/use-create-conversation';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MessageButtonProps extends ButtonProps {
  userId: string;
  compact?: boolean;
  showIcon?: boolean;
  initialMessage?: string;
  autoSend?: boolean;
  showTooltip?: boolean;
}

const MessageButton = ({ 
  userId, 
  compact = false, 
  showIcon = true,
  initialMessage,
  autoSend = false,
  showTooltip = false,
  className,
  ...props 
}: MessageButtonProps) => {
  const navigate = useNavigate();
  const { createConversation, isCreating } = useCreateConversation();

  const handleMessageClick = async () => {
    try {
      // Direct navigation using user ID - the Messages component will handle the conversation lookup/creation
      navigate(`/messages/${userId}`, { 
        state: { 
          fromSearch: true, 
          initialMessage,
          autoSend,
          previousPath: window.location.pathname + window.location.search
        }
      });
    } catch (error) {
      console.error('Failed to navigate to messages:', error);
      toast.error('Could not open messages');
    }
  };

  const buttonContent = (
    <Button
      onClick={handleMessageClick}
      disabled={isCreating}
      size={compact ? "sm" : "default"}
      className={cn(
        "gap-2", 
        className
      )}
      {...props}
    >
      {showIcon && <MessageSquare className={compact ? "h-4 w-4" : "h-5 w-5"} />}
      {!compact && <span>Message</span>}
    </Button>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" className="z-50">
            <span className="text-xs">Say Hi</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};

export default MessageButton;
