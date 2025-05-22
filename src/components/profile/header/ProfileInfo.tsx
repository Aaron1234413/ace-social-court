
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import FollowButton from '@/components/social/FollowButton';
import MessageButton from '@/components/messages/MessageButton';

interface ProfileInfoProps {
  fullName: string | null;
  username: string | null;
  locationName: string | null;
  isOwnProfile: boolean;
  userId: string;
}

export const ProfileInfo = ({ 
  fullName, 
  username, 
  locationName, 
  isOwnProfile, 
  userId 
}: ProfileInfoProps) => {
  return (
    <div className="flex flex-col items-center p-6 relative">
      {/* Action buttons - positioned top right */}
      <div className="absolute top-0 right-0">
        {isOwnProfile ? (
          <Button asChild size="sm" variant="secondary" className="bg-primary/90 text-primary-foreground hover:bg-primary shadow-md">
            <Link to="/profile/edit">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        ) : (
          <div className="flex gap-2">
            <FollowButton userId={userId} />
            <MessageButton userId={userId} />
          </div>
        )}
      </div>
      
      {/* User name and username */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold">{fullName || username}</h1>
        {username && <p className="text-muted-foreground">@{username}</p>}
      </div>
      
      {/* Display location if available */}
      {locationName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{locationName}</span>
        </div>
      )}
    </div>
  );
};
