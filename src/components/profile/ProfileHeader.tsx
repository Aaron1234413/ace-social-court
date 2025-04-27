
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface ProfileHeaderProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ProfileHeader = ({ userId, isOwnProfile }: ProfileHeaderProps) => {
  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
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

  const { data: followerCount } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_followers_count', { user_id: userId });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: followingCount } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_following_count', { user_id: userId });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profile?.username || 'User'}</h1>
          <p className="text-muted-foreground">{profile?.full_name}</p>
        </div>
        {isOwnProfile ? (
          <Button asChild variant="outline">
            <Link to="/profile/edit">Edit Profile</Link>
          </Button>
        ) : (
          <Button>Follow</Button>
        )}
      </div>

      <div className="flex gap-6">
        <div>
          <span className="font-bold">{followerCount || 0}</span>
          <span className="text-muted-foreground ml-1">followers</span>
        </div>
        <div>
          <span className="font-bold">{followingCount || 0}</span>
          <span className="text-muted-foreground ml-1">following</span>
        </div>
      </div>

      {profile?.bio && (
        <p className="text-sm">{profile.bio}</p>
      )}

      <div className="flex flex-col gap-2">
        {profile?.playing_style && (
          <div className="text-sm">
            <span className="font-medium">Playing Style:</span> {profile.playing_style}
          </div>
        )}
        {profile?.experience_level && (
          <div className="text-sm">
            <span className="font-medium">Experience:</span> {profile.experience_level}
          </div>
        )}
      </div>
    </div>
  );
};
