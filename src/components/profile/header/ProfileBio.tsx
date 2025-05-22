
import { MapPin } from 'lucide-react';

interface ProfileBioProps {
  bio: string | null;
  userType: string | null;
  experienceLevel: string | null;
  playingStyle: string | null;
  locationName: string | null;
}

export const ProfileBio = ({ 
  bio, 
  userType, 
  experienceLevel, 
  playingStyle, 
  locationName 
}: ProfileBioProps) => {
  return (
    <div className="space-y-6">
      {bio && (
        <div>
          <h2 className="font-semibold text-lg mb-2">About Me</h2>
          <p className="whitespace-pre-wrap text-md">{bio}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {userType && (
          <div className="p-3 bg-secondary/30 rounded-lg">
            <span className="text-muted-foreground block">Account Type</span>
            <span className="capitalize font-medium">{userType}</span>
          </div>
        )}
        {experienceLevel && (
          <div className="p-3 bg-secondary/30 rounded-lg">
            <span className="text-muted-foreground block">Experience</span>
            <span className="capitalize font-medium">{experienceLevel}</span>
          </div>
        )}
        {playingStyle && (
          <div className="p-3 bg-secondary/30 rounded-lg">
            <span className="text-muted-foreground block">Playing Style</span>
            <span className="font-medium">{playingStyle}</span>
          </div>
        )}
      </div>
      
      {locationName && (
        <div className="flex items-center gap-2 text-sm bg-secondary/30 p-3 rounded-lg">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{locationName}</span>
        </div>
      )}
    </div>
  );
};
