
import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { MessageButton } from '@/components/messages/MessageButton';
import { SearchUser } from '@/hooks/useSearch';
import { FollowButton } from '@/components/social/FollowButton';

interface UserSearchResultsProps {
  users: SearchUser[];
}

const UserSearchResults: React.FC<UserSearchResultsProps> = ({ users }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <Link to={`/profile/${user.id}`} className="flex items-start gap-3 group">
                <Avatar className="h-12 w-12 border">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.full_name || 'User'} />
                  ) : (
                    <AvatarFallback className="bg-tennis-green/10 text-tennis-green">
                      {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div>
                  <h3 className="font-medium group-hover:text-tennis-green transition-colors">
                    {user.full_name || user.username || 'Anonymous User'}
                  </h3>
                  {user.username && (
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  )}
                </div>
              </Link>
              
              <MessageButton 
                userId={user.id} 
                variant="outline" 
                compact={true} 
              />
            </div>
            
            <div className="mt-3 space-y-2">
              {user.user_type && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className={`${
                      user.user_type === 'coach' ? 'bg-tennis-green/10 text-tennis-green' : 
                      user.user_type === 'player' ? 'bg-blue-500/10 text-blue-500' : 
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                  </Badge>
                  
                  {user.skill_level && (
                    <Badge variant="secondary">
                      Level: {user.skill_level}
                    </Badge>
                  )}
                </div>
              )}
              
              {user.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {user.bio}
                </p>
              )}
              
              {user.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>📍</span> {user.location}
                </p>
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <FollowButton userId={user.id} variant="outline" size="sm" />
              <Link 
                to={`/profile/${user.id}`} 
                className="text-xs text-tennis-green hover:underline transition-all"
              >
                View profile
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default UserSearchResults;
