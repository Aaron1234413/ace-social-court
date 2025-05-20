
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

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
    <div className="border-b px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
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
            <Avatar className="h-10 w-10 border-2 border-tennis-green/20">
              {otherUser?.avatar_url && (
                <img src={otherUser.avatar_url} alt={otherUser?.username || 'User'} className="object-cover" />
              )}
              <AvatarFallback className="bg-tennis-green/10 text-tennis-darkGreen">
                {otherUser?.full_name?.charAt(0) || 
                otherUser?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {otherUser?.full_name || otherUser?.username || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {otherUser?.username && otherUser?.full_name ? `@${otherUser.username}` : ''}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full hidden md:flex">
          <Phone className="h-4 w-4" />
          <span className="sr-only">Call</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full hidden md:flex">
          <Video className="h-4 w-4" />
          <span className="sr-only">Video call</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>Mute conversation</DropdownMenuItem>
            <DropdownMenuItem>Search in conversation</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Block user</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;
