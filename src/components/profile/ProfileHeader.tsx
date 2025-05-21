
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pencil, MapPin, Calendar, Award } from 'lucide-react';
import FollowButton from '@/components/social/FollowButton';
import MessageButton from '@/components/messages/MessageButton';

interface ProfileHeaderProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ProfileHeader = ({ userId, isOwnProfile }: ProfileHeaderProps) => {
  const { data: profile, isLoading } = useQuery({
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

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Avatar className="w-20 h-20 border-2 border-background">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username || 'User avatar'} />
          ) : (
            <AvatarFallback className="text-2xl">
              {profile.username?.[0]?.toUpperCase() || profile.full_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
          {profile.username && <p className="text-muted-foreground">@{profile.username}</p>}
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
            <div>
              <span className="font-semibold">{followingCount || 0}</span> Following
            </div>
            <div>
              <span className="font-semibold">{followersCount || 0}</span> Followers
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-semibold">{matchesCount || 0}</span> Matches
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">{sessionsCount || 0}</span> Sessions
            </div>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col gap-2">
          {isOwnProfile ? (
            <Button asChild size="sm">
              <Link to="/profile/edit">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          ) : (
            <>
              <FollowButton userId={userId} />
              <MessageButton userId={userId} />
            </>
          )}
        </div>
      </div>
      {profile.bio && (
        <div>
          <h2 className="font-semibold mb-1">Bio</h2>
          <p className="whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        {profile.user_type && (
          <div>
            <span className="text-muted-foreground block">Account Type</span>
            <span className="capitalize">{profile.user_type}</span>
          </div>
        )}
        {profile.experience_level && (
          <div>
            <span className="text-muted-foreground block">Experience</span>
            <span className="capitalize">{profile.experience_level}</span>
          </div>
        )}
        {profile.playing_style && (
          <div>
            <span className="text-muted-foreground block">Playing Style</span>
            <span>{profile.playing_style}</span>
          </div>
        )}
      </div>
      
      {/* Display location if available */}
      {profile.location_name && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{profile.location_name}</span>
        </div>
      )}
    </div>
  );
};
