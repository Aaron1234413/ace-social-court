
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { CoverPhoto } from './header/CoverPhoto';
import { ProfileAvatar } from './header/ProfileAvatar';
import { ProfileInfo } from './header/ProfileInfo';
import { ProfileStats } from './header/ProfileStats';
import { ProfileBio } from './header/ProfileBio';
import { SkillsSection } from './header/SkillsSection';

interface ProfileHeaderProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ProfileHeader = ({ userId, isOwnProfile }: ProfileHeaderProps) => {
  const { refreshProfile } = useAuth();
  
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile-header', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, cover_photo_url')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }
  
  // Handler for when profile media is updated
  const handleProfileUpdated = async () => {
    await refreshProfile();
    await refetch();
  };

  return (
    <div className="space-y-6">
      {/* Cover Photo Section */}
      <CoverPhoto 
        userId={userId} 
        coverPhotoUrl={profile.cover_photo_url} 
        isOwnProfile={isOwnProfile}
        onCoverPhotoUpdated={handleProfileUpdated}
      />

      {/* Profile Header with Avatar and Basic Info */}
      <ProfileAvatar
        userId={userId}
        avatarUrl={profile.avatar_url}
        username={profile.username}
        fullName={profile.full_name}
        isOwnProfile={isOwnProfile}
        onAvatarUpdated={handleProfileUpdated}
      />
      
      {/* Profile Info section */}
      <ProfileInfo
        fullName={profile.full_name}
        username={profile.username}
        locationName={profile.location_name}
        isOwnProfile={isOwnProfile}
        userId={userId}
      />

      {/* Profile Stats Bar */}
      <ProfileStats userId={userId} />
      
      {/* Bio and skills section - Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Left column - Bio and details */}
        <ProfileBio 
          bio={profile.bio}
          userType={profile.user_type}
          experienceLevel={profile.experience_level}
          playingStyle={profile.playing_style}
          locationName={profile.location_name}
        />
        
        {/* Right column - Skills tracking */}
        <SkillsSection userId={userId} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  );
};
