
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AchievementsList } from '@/components/profile/AchievementsList';
import { CertificationsList } from '@/components/profile/CertificationsList';
import { ProfileMediaGallery } from '@/components/profile/ProfileMediaGallery';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { initializeStorage } from '@/integrations/supabase/storage';
import { toast } from 'sonner';
import { Loader2, BarChart2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import ProfileDashboardButton from '@/components/profile/ProfileDashboardButton';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: profileIdentifierFromUrl } = useParams();
  
  // Handle different types of identifiers in the URL (username or ID)
  const [profileIdentifier, setProfileIdentifier] = useState<string | null>(null);
  const isOwnProfile = user?.id === profileIdentifierFromUrl || user?.id === profileIdentifier;

  // Determine the correct profile identifier (user ID or username)
  useEffect(() => {
    if (!profileIdentifierFromUrl && !user) {
      navigate('/auth');
      return;
    }
    
    // If no username provided in URL, use current user's ID
    if (!profileIdentifierFromUrl && user) {
      setProfileIdentifier(user.id);
    } else {
      // Use provided username/ID from the URL
      setProfileIdentifier(profileIdentifierFromUrl || null);
    }
    
    // Initialize storage buckets if needed
    if (user) {
      initializeStorage().catch(err => {
        console.error('Failed to initialize storage:', err);
        toast.error('Error initializing media storage');
      });
    }
  }, [user, navigate, profileIdentifierFromUrl]);

  // Query by username first, then by user ID if username not found
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', profileIdentifier],
    queryFn: async () => {
      if (!profileIdentifier) return null;
      
      // First try to find by username (for friendly URLs)
      const { data: usernameData, error: usernameError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', profileIdentifier)
        .single();
      
      if (usernameData) return usernameData;
      
      // If not found by username, try by user ID
      const { data: idData, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileIdentifier)
        .single();
      
      if (idError && usernameError) {
        console.error('Profile not found:', { usernameError, idError });
        throw new Error('Profile not found');
      }
      
      return idData;
    },
    enabled: !!profileIdentifier
  });

  if (!profileIdentifier) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="container mx-auto px-4 py-8">Profile not found</div>;
  }

  return (
    <>
      {profile && (
        <Helmet>
          <title>{profile.full_name || 'User'} - rallypointx</title>
          <meta name="description" content={`${profile.user_type === 'coach' ? 'Tennis coach' : 'Tennis player'} profile on rallypointx`} />
          <meta property="og:title" content={`${profile.full_name || 'User'} - rallypointx`} />
          <meta property="og:description" content={`${profile.user_type === 'coach' ? 'Tennis coach' : 'Tennis player'} profile on rallypointx`} />
          <meta property="og:type" content="profile" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={`${profile.full_name || 'User'} - rallypointx`} />
          <meta name="twitter:description" content={`${profile.user_type === 'coach' ? 'Tennis coach' : 'Tennis player'} profile on rallypointx`} />
        </Helmet>
      )}

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        <ProfileHeader userId={profile.id} isOwnProfile={isOwnProfile} />
        
        {/* Add dashboard button if it's the user's own profile */}
        {isOwnProfile && (
          <div className="flex justify-end">
            <ProfileDashboardButton userId={profile.id} isOwnProfile={isOwnProfile} />
          </div>
        )}
        
        <Separator />
        <ProfileMediaGallery userId={profile.id} />
        <Separator />
        <AchievementsList userId={profile.id} />
        {profile.user_type === 'coach' && (
          <>
            <Separator />
            <CertificationsList userId={profile.id} />
          </>
        )}
      </div>
    </>
  );
};

export default Profile;
