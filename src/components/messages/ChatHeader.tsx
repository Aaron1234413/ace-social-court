
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  otherUser: {
    avatar_url?: string | null;
    full_name?: string | null;
    username?: string | null;
  } | null;
  isLoading: boolean;
  hasError: boolean;
}

const ChatHeader = ({ otherUser, isLoading, hasError }: ChatHeaderProps) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/messages');
  };

  return (
    <div className="border-b px-4 py-3 flex items-center bg-background sticky top-0 z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden mr-2"
        onClick={handleBackClick}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back</span>
      </Button>
      
      {isLoading ? (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-[100px]" />
        </div>
      ) : hasError ? (
        <div className="text-destructive text-sm">Failed to load user</div>
      ) : (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {otherUser?.avatar_url && (
              <img src={otherUser.avatar_url} alt={otherUser?.username || 'User'} />
            )}
            <AvatarFallback>
              {otherUser?.full_name?.charAt(0) || 
               otherUser?.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {otherUser?.full_name || otherUser?.username || 'User'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
