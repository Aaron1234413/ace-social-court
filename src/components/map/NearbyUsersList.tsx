
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, ChevronRight, Users, UserCog, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMapExplorer } from '@/contexts/MapExplorerContext';

export interface NearbyUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type: string;
  distance: number; // in miles
  latitude: number;
  longitude: number;
  skill_level?: string | null; // Add skill level property
}

interface NearbyUsersListProps {
  users: NearbyUser[];
  isLoading: boolean;
  onUserSelect: (user: NearbyUser) => void;
}

const NearbyUsersList = ({ users, isLoading, onUserSelect }: NearbyUsersListProps) => {
  const navigate = useNavigate();
  const { filters, handleFilterChange } = useMapExplorer();
  const [selectedType, setSelectedType] = useState<'all' | 'player' | 'coach'>('all');
  
  // Filter users by type and skill level
  const filteredUsers = users.filter(user => {
    // Filter by user type
    const typeMatch = selectedType === 'all' || user.user_type === selectedType;
    
    // Filter by skill level if selected
    const skillLevelMatch = !filters.skillLevel || 
      user.skill_level === filters.skillLevel || 
      !user.skill_level; // Include users with no skill level set
      
    return typeMatch && skillLevelMatch;
  });
  
  const formatDistance = (distance: number) => {
    if (distance < 0.1) return 'Less than 0.1 mi';
    return `${distance.toFixed(1)} mi`;
  };
  
  const viewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Available skill levels
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
  
  // Get user type badge color
  const getUserTypeColor = (type: string) => {
    if (type === 'coach') return 'bg-gradient-to-r from-purple-500 to-purple-600 border-none text-white';
    return 'bg-gradient-to-r from-tennis-blue to-blue-500 border-none text-white';
  };
  
  return (
    <div className="bg-card rounded-xl border shadow-sm p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Nearby Tennis Community</h3>
        <div className="flex gap-2">
          <Badge 
            variant={selectedType === 'all' ? "default" : "outline"}
            onClick={() => setSelectedType('all')}
            className={`cursor-pointer transition-all duration-200 ${selectedType === 'all' ? 'bg-gradient-to-r from-tennis-blue to-tennis-green border-none text-white' : ''}`}
          >
            All
          </Badge>
          <Badge 
            variant={selectedType === 'player' ? "default" : "outline"}
            onClick={() => setSelectedType('player')}
            className={`cursor-pointer transition-all duration-200 flex gap-1 items-center ${selectedType === 'player' ? 'bg-gradient-to-r from-tennis-blue to-blue-600 border-none text-white' : ''}`}
          >
            <Users className="h-3 w-3" /> Players
          </Badge>
          <Badge 
            variant={selectedType === 'coach' ? "default" : "outline"}
            onClick={() => setSelectedType('coach')}
            className={`cursor-pointer transition-all duration-200 flex gap-1 items-center ${selectedType === 'coach' ? 'bg-gradient-to-r from-purple-500 to-purple-700 border-none text-white' : ''}`}
          >
            <UserCog className="h-3 w-3" /> Coaches
          </Badge>
        </div>
      </div>
      
      {/* Add skill level filter */}
      <div className="flex items-center gap-2 mb-3 bg-muted/50 p-2 rounded-md">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">Skill Level:</span>
        <Select
          value={filters.skillLevel || ''}
          onValueChange={(value) => handleFilterChange('skillLevel', value || null)}
        >
          <SelectTrigger className="h-8 text-xs w-[120px] bg-background">
            <SelectValue placeholder="Any level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any level</SelectItem>
            {skillLevels.map(level => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Separator className="mb-3" />
      
      <ScrollArea className="h-[240px] pr-3">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block p-3 bg-muted rounded-full animate-pulse mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground animate-pulse">Finding nearby players and coaches...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-block p-3 bg-muted rounded-full mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {users.length === 0 
                ? "No players or coaches found nearby" 
                : `No ${selectedType === 'all' ? 'users' : selectedType + 's'} found${filters.skillLevel ? ` with ${filters.skillLevel} skill level` : ''}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user, index) => (
              <div 
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onUserSelect(user)}
              >
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.full_name || "User"} />
                  ) : (
                    <AvatarFallback className={user.user_type === 'coach' ? "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700" : "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700"}>
                      {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.full_name || user.username}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default" className={`text-xs ${getUserTypeColor(user.user_type)}`}>
                      {user.user_type === 'coach' ? 'Coach' : 'Player'}
                    </Badge>
                    {user.skill_level && (
                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-muted/30 to-muted/10">
                        {user.skill_level}
                      </Badge>
                    )}
                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {formatDistance(user.distance)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 rounded-full hover:bg-background hover:text-primary transition-colors" 
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
