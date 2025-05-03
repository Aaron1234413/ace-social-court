import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = id || user?.id;
  const isOwnProfile = userId === user?.id;

  useEffect(() => {
    if (!user && !id) {
      navigate('/auth');
      return;
    }

    // Initialize storage buckets if needed
    if (user) {
      initializeStorage().catch(err => {
        console.error('Failed to initialize storage:', err);
        toast.error('Error initializing media storage');
      });
    }
  }, [user, navigate, id]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  if (!userId) {
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

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        <ProfileHeader userId={userId} isOwnProfile={isOwnProfile} />
        <Separator />
        <ProfileMediaGallery userId={userId} />
        <Separator />
        <AchievementsList userId={userId} />
        {profile.user_type === 'coach' && (
          <>
            <Separator />
            <CertificationsList userId={userId} />
          </>
        )}
      </div>
    </>
  );
};

export default Profile;
