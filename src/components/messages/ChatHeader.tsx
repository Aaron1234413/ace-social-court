
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Search } from 'lucide-react';

interface ChatHeaderProps {
  otherUser: any;
  isLoading: boolean;
  hasError: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  otherUser,
  isLoading,
  hasError
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleBackToSearch = () => {
    navigate('/search', { state: { fromMessages: true } });
  };

  if (isLoading) {
    return (
      <header className="border-b p-3 flex items-center h-16">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted"></div>
          <div className="h-4 w-28 bg-muted rounded"></div>
        </div>
      </header>
    );
  }

  if (hasError || !otherUser) {
    return (
      <header className="border-b p-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-muted-foreground">Unknown user</span>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleBackToSearch} className="ml-auto">
          <Search className="h-4 w-4 mr-2" />
          {!isMobile && <span>Back to Search</span>}
        </Button>
      </header>
    );
  }

  return (
    <header className="border-b p-3 flex items-center justify-between h-16">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        <Link to={`/profile/${otherUser.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar>
            {otherUser.avatar_url ? (
              <AvatarImage src={otherUser.avatar_url} alt={otherUser.full_name || 'User'} />
            ) : (
              <AvatarFallback>
                {otherUser.full_name?.charAt(0) || otherUser.username?.charAt(0) || '?'}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div>
            <h2 className="font-medium">
              {otherUser.full_name || otherUser.username || 'Unknown User'}
            </h2>
            {otherUser.username && (
              <p className="text-xs text-muted-foreground">
                @{otherUser.username}
              </p>
            )}
          </div>
        </Link>
      </div>
      
      <Button variant="ghost" size="sm" onClick={handleBackToSearch} className="ml-auto">
        <Search className="h-4 w-4 mr-2" />
        {!isMobile && <span>Back to Search</span>}
      </Button>
    </header>
  );
};

export default ChatHeader;
