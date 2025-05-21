
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import FollowButton from '@/components/social/FollowButton';
import { useAuth } from '@/components/AuthProvider';
import { UserCheck, MapPin, Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type?: string;
  bio?: string | null;
}

interface UserSearchResultsProps {
  users: User[];
}

const UserCard = ({ user }: { user: User }) => {
  const { user: currentUser } = useAuth();
  const [flipped, setFlipped] = useState(false);
  const [favorite, setFavorite] = useState(false);
  
  return (
    <div 
      className="perspective-1000 relative h-[220px] transition-all duration-300 cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <Card 
        className={cn(
          "absolute inset-0 backface-hidden transition-all duration-500 p-4 flex flex-col",
          flipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
        )}
      >
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-tennis-green/10 flex items-center justify-center overflow-hidden border-2 border-tennis-green/30">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name || 'User'} 
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-tennis-darkGreen">
                {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${user.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold text-base truncate">
                {user.full_name || user.username || 'Anonymous User'}
              </h3>
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {user.username && <span>@{user.username}</span>}
              <Badge variant={user.user_type === 'coach' ? 'default' : 'secondary'} className="text-xs">
                {user.user_type === 'coach' ? 'Coach' : 'Player'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <MapPin className="h-3 w-3" />
              <span>Local area</span>
            </div>
          </div>
        </div>
        
        {user.bio && (
          <p className="text-sm text-muted-foreground mt-4 line-clamp-3">
            {user.bio}
          </p>
        )}
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Tap card to see more
          </div>
          
          {currentUser && currentUser.id === user.id && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <UserCheck className="h-3 w-3" />
              <span>You</span>
            </div>
          )}
        </div>
      </Card>
      
      {/* Back of card */}
      <Card 
        className={cn(
          "absolute inset-0 backface-hidden transition-all duration-500 p-4 flex flex-col",
          !flipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
        )}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-2">
            {user.full_name || user.username || 'Anonymous User'}
          </h3>
          
          {user.bio ? (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {user.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              This user hasn't added a bio yet.
            </p>
          )}
        </div>
        
        <div className="mt-4 flex flex-col gap-2">
          {currentUser && currentUser.id !== user.id && (
            <>
              <div className="flex items-center gap-2">
                <Button 
                  variant={favorite ? "default" : "outline"} 
                  size="sm" 
                  className={cn(
                    "flex-1 gap-2",
                    favorite && "bg-yellow-500 hover:bg-yellow-600"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFavorite(!favorite);
                  }}
                >
                  <Star className={cn("h-4 w-4", favorite && "fill-white")} />
                  <span>{favorite ? "Favorited" : "Favorite"}</span>
                </Button>
                
                <Link to={`/messages/${user.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Message</span>
                  </Button>
                </Link>
              </div>
              
              <FollowButton userId={user.id} className="w-full" />
            </>
          )}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Tap to flip card back
        </div>
      </Card>
    </div>
  );
};

const UserSearchResults: React.FC<UserSearchResultsProps> = ({ users }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};

export default UserSearchResults;
