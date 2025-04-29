
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FollowButton from '@/components/social/FollowButton';
import { useAuth } from '@/components/AuthProvider';

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type: string;
  bio: string | null;
}

interface UserSearchResultsProps {
  users: User[];
}

const UserSearchResults = ({ users }: UserSearchResultsProps) => {
  const { user: currentUser } = useAuth();

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div 
          key={user.id}
          className="flex gap-4 items-center border rounded-lg p-4 hover:bg-accent/5 transition-colors"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name || 'User'} 
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user.full_name?.charAt(0) || '?'
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${user.id}`} className="hover:underline">
              <h3 className="font-semibold text-base truncate">
                {user.full_name || 'Anonymous User'}
              </h3>
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {user.username && <span>@{user.username}</span>}
              <Badge variant={user.user_type === 'coach' ? 'default' : 'secondary'} className="text-xs">
                {user.user_type === 'coach' ? 'Coach' : 'Player'}
              </Badge>
            </div>
            
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {user.bio}
              </p>
            )}
          </div>
          
          {currentUser && currentUser.id !== user.id && (
            <div className="ml-auto">
              <FollowButton userId={user.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserSearchResults;
