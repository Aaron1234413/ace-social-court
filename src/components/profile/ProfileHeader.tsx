import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, MapPin, Calendar, Award, Upload, Image } from 'lucide-react';
import FollowButton from '@/components/social/FollowButton';
import MessageButton from '@/components/messages/MessageButton';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { uploadFileWithProgress } from '@/integrations/supabase/storage';
import { Input } from '@/components/ui/input';

interface ProfileHeaderProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ProfileHeader = ({ userId, isOwnProfile }: ProfileHeaderProps) => {
  const { user, refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile-header', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: followingCount } = useQuery({
    queryKey: ['following-count', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_following_count', { user_id: userId });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: followersCount } = useQuery({
    queryKey: ['followers-count', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_followers_count', { user_id: userId });
      
      if (error) throw error;
      return data;
    }
  });

  // Add queries for match and session counts
  const { data: matchesCount } = useQuery({
    queryKey: ['matches-count', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: sessionsCount } = useQuery({
    queryKey: ['sessions-count', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) throw error;
      return count || 0;
    }
  });
  
  // Query skill ratings from matches
  const { data: skillRatings } = useQuery({
    queryKey: ['skill-ratings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('serve_rating, return_rating, endurance_rating')
        .eq('user_id', userId)
        .order('match_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Calculate average ratings from recent matches
      const avgRatings = {
        serve: 0,
        return: 0,
        endurance: 0,
        forehand: Math.floor(Math.random() * 5) + 1, // Placeholder for demo
        backhand: Math.floor(Math.random() * 5) + 1, // Placeholder for demo
      };
      
      if (data && data.length > 0) {
        let serveSum = 0;
        let returnSum = 0;
        let enduranceSum = 0;
        let count = 0;
        
        data.forEach(match => {
          if (match.serve_rating) {
            serveSum += match.serve_rating;
            count++;
          }
          if (match.return_rating) {
            returnSum += match.return_rating;
          }
          if (match.endurance_rating) {
            enduranceSum += match.endurance_rating;
          }
        });
        
        if (count > 0) {
          avgRatings.serve = Math.round(serveSum / count);
          avgRatings.return = Math.round(returnSum / count);
          avgRatings.endurance = Math.round(enduranceSum / count);
        }
      }
      
      return avgRatings;
    }
  });

  // Enhanced avatar upload handler
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Enhanced file validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large', {
          description: 'Please upload an image under 5MB.'
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file format', {
          description: 'Only image files are allowed (.jpg, .png, .gif, etc).'
        });
        return;
      }
      
      // Upload the file with progress tracking
      const avatarUrl = await uploadFileWithProgress(
        file,
        'message_media',
        userId,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Update the profile with the new avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Refresh global profile state - this ensures the avatar is updated everywhere
      await refreshProfile();
      
      // Also refetch the current profile view
      refetch();
      
      toast.success('Profile picture updated', {
        description: 'Your new profile picture will appear across the app.'
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Upload failed', {
        description: 'Could not update your profile picture. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header with Avatar and Actions */}
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
        
        {/* Avatar with enhanced upload option */}
        <div className="relative group mb-4">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.username || 'User avatar'} />
            ) : (
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {profile.username?.[0]?.toUpperCase() || profile.full_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          
          {/* Enhanced profile photo upload overlay with better UX */}
          {isOwnProfile && (
            <label 
              htmlFor="avatar-upload" 
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Update profile picture"
              role="button"
            >
              <Image className="h-6 w-6 text-white mb-1" />
              <span className="text-xs text-white font-medium">Update</span>
              <Input 
                type="file" 
                id="avatar-upload" 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload}
                disabled={isUploading}
                aria-label="Upload profile picture"
              />
            </label>
          )}
        </div>
        
        {/* Enhanced Upload progress indicator */}
        {isUploading && (
          <div className="mt-2 w-32 flex flex-col items-center">
            <Progress value={uploadProgress} className="h-1 mb-1" />
            <span className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</span>
          </div>
        )}
        
        {/* User name and username */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
          {profile.username && <p className="text-muted-foreground">@{profile.username}</p>}
        </div>
        
        {/* Display location if available */}
        {profile.location_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{profile.location_name}</span>
          </div>
        )}
      </div>

      {/* Profile Stats Bar */}
      <div className="flex flex-wrap justify-center gap-4 my-8">
        <ProfileStatCard 
          icon="users" 
          count={followingCount || 0} 
          label="Following" 
          href={`/profile/${userId}/following`}
        />
        <ProfileStatCard 
          icon="users-round" 
          count={followersCount || 0} 
          label="Followers" 
          href={`/profile/${userId}/followers`}
        />
        <ProfileStatCard 
          icon="award" 
          count={matchesCount || 0} 
          label="Matches" 
          href={`/profile/${userId}/matches`}
        />
        <ProfileStatCard 
          icon="calendar-days" 
          count={sessionsCount || 0} 
          label="Sessions" 
          href={`/profile/${userId}/sessions`}
        />
      </div>
      
      {/* Bio and skills section - Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Left column - Bio and details */}
        <div className="space-y-6">
          {profile.bio && (
            <div>
              <h2 className="font-semibold text-lg mb-2">About Me</h2>
              <p className="whitespace-pre-wrap text-md">{profile.bio}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {profile.user_type && (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground block">Account Type</span>
                <span className="capitalize font-medium">{profile.user_type}</span>
              </div>
            )}
            {profile.experience_level && (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground block">Experience</span>
                <span className="capitalize font-medium">{profile.experience_level}</span>
              </div>
            )}
            {profile.playing_style && (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground block">Playing Style</span>
                <span className="font-medium">{profile.playing_style}</span>
              </div>
            )}
          </div>
          
          {/* Display location if available */}
          {profile.location_name && (
            <div className="flex items-center gap-2 text-sm bg-secondary/30 p-3 rounded-lg">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{profile.location_name}</span>
            </div>
          )}
        </div>
        
        {/* Right column - Skills tracking */}
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-lg mb-4">Skills Progress</h2>
            <div className="space-y-4">
              <SkillProgressBar 
                label="Serve" 
                value={skillRatings?.serve || 0} 
                maxValue={5}
                color="bg-green-500"
              />
              <SkillProgressBar 
                label="Return" 
                value={skillRatings?.return || 0} 
                maxValue={5}
                color="bg-blue-500"
              />
              <SkillProgressBar 
                label="Forehand" 
                value={skillRatings?.forehand || 0} 
                maxValue={5}
                color="bg-purple-500"
              />
              <SkillProgressBar 
                label="Backhand" 
                value={skillRatings?.backhand || 0} 
                maxValue={5}
                color="bg-red-500"
              />
              <SkillProgressBar 
                label="Endurance" 
                value={skillRatings?.endurance || 0} 
                maxValue={5}
                color="bg-yellow-500"
              />
            </div>
            
            {isOwnProfile && (
              <div className="mt-4">
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Full Stats
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Skill Progress Bar Component
interface SkillProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

const SkillProgressBar = ({ label, value, maxValue, color }: SkillProgressBarProps) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">{label}</span>
        <span className="text-sm text-muted-foreground">{value}/{maxValue}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Profile Stat Card Component
interface ProfileStatCardProps {
  icon: "users" | "users-round" | "award" | "calendar-days";
  count: number;
  label: string;
  href: string;
}

const ProfileStatCard = ({ icon, count, label, href }: ProfileStatCardProps) => {
  // Import the appropriate icon based on the icon prop
  let IconComponent;
  if (icon === "users") {
    IconComponent = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  } else if (icon === "users-round") {
    IconComponent = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users-round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>;
  } else if (icon === "award") {
    IconComponent = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>;
  } else if (icon === "calendar-days") {
    IconComponent = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>;
  }
  
  return (
    <Link to={href} className="group">
      <div className="flex items-center gap-3 px-4 py-3 bg-background rounded-full border shadow-sm transition-all hover:border-primary hover:shadow-md hover:shadow-primary/10 group-hover:scale-105">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
          {IconComponent && <IconComponent />}
        </div>
        <div>
          <p className="text-xl font-semibold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Link>
  );
};
