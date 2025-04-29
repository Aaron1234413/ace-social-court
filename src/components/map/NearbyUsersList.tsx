
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, ChevronRight, Users, UserCog } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

export interface NearbyUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type: string;
  distance: number; // in miles
  latitude: number;
  longitude: number;
}

interface NearbyUsersListProps {
  users: NearbyUser[];
  isLoading: boolean;
  onUserSelect: (user: NearbyUser) => void;
}

const NearbyUsersList = ({ users, isLoading, onUserSelect }: NearbyUsersListProps) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'all' | 'player' | 'coach'>('all');
  
  const filteredUsers = users.filter(user => 
    selectedType === 'all' || user.user_type === selectedType
  );
  
  const formatDistance = (distance: number) => {
    if (distance < 0.1) return 'Less than 0.1 mi';
    return `${distance.toFixed(1)} mi`;
  };
  
  const viewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };
  
  return (
    <div className="bg-background rounded-lg border shadow-sm p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Nearby Tennis Community</h3>
        <div className="flex gap-2">
          <Badge 
            variant={selectedType === 'all' ? "default" : "outline"}
            onClick={() => setSelectedType('all')}
            className="cursor-pointer"
          >
            All
          </Badge>
          <Badge 
            variant={selectedType === 'player' ? "default" : "outline"}
            onClick={() => setSelectedType('player')}
            className="cursor-pointer flex gap-1 items-center"
          >
            <Users className="h-3 w-3" /> Players
          </Badge>
          <Badge 
            variant={selectedType === 'coach' ? "default" : "outline"}
            onClick={() => setSelectedType('coach')}
            className="cursor-pointer flex gap-1 items-center"
          >
            <UserCog className="h-3 w-3" /> Coaches
          </Badge>
        </div>
      </div>
      
      <Separator className="mb-3" />
      
      <ScrollArea className="h-[240px] pr-3">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Finding nearby players and coaches...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {users.length === 0 
              ? "No players or coaches found nearby" 
              : `No ${selectedType === 'all' ? 'users' : selectedType + 's'} found nearby`
            }
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div 
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onUserSelect(user)}
              >
                <Avatar className="h-10 w-10">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.full_name || "User"} />
                  ) : (
                    <AvatarFallback>
                      {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.full_name || user.username}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.user_type === 'coach' ? "default" : "secondary"} className="text-xs">
                      {user.user_type === 'coach' ? 'Coach' : 'Player'}
                    </Badge>
                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {formatDistance(user.distance)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0" 
                    onClick={(e) => {
                      e.stopPropagation();
                      viewProfile(user.id);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NearbyUsersList;
