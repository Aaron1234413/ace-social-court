
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useCreateConversation } from '@/hooks/use-create-conversation';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
      createConversation(userId, {
        onSuccess: (conversationId: string) => {
          console.log("Successfully created or found conversation:", conversationId);
          // Navigate to the conversation with optional initial message
          navigate(`/messages/${conversationId}`, { 
            state: { 
              fromSearch: true, 
              initialMessage,
              autoSend,
              previousPath: window.location.pathname + window.location.search
            } 
          });
        },
        onError: (error: Error) => {
          console.error('Error creating conversation:', error);
          // Check if we got the duplicate key error, which we can handle gracefully
          if (error.message?.includes('duplicate key value')) {
            // Try to fetch the existing conversation
            getExistingConversation(userId);
          } else {
            toast.error('Could not start conversation');
          }
        }
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  // Helper function to get existing conversation and navigate to it
  const getExistingConversation = async (otherUserId: string) => {
    try {
      // Use lexicographical sorting for consistency with how conversations are created
      const user1 = userId < otherUserId ? userId : otherUserId;
      const user2 = userId > otherUserId ? userId : otherUserId;
      
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .maybeSingle();
      
      if (error) {
        console.error('Error finding conversation with exact match:', error);
        
        // Try with OR condition as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
          .maybeSingle();
          
        if (fallbackError) {
          throw fallbackError;
        }
        
        if (fallbackData) {
          navigateToConversation(fallbackData.id);
        } else {
          toast.error('Could not find your conversation');
        }
        return;
      }
      
      if (data) {
        navigateToConversation(data.id);
      } else {
        toast.error('Could not find your conversation');
      }
    } catch (err) {
      console.error('Error finding conversation:', err);
      toast.error('Could not start conversation');
    }
  };
  
  // Helper function to navigate to a conversation
  const navigateToConversation = (conversationId: string) => {
    navigate(`/messages/${conversationId}`, { 
      state: { 
        fromSearch: true, 
        initialMessage,
        autoSend,
        previousPath: window.location.pathname + window.location.search
      } 
    });
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
