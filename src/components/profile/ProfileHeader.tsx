
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  // Use a default cover image since cover_url doesn't exist in the profiles table
  const defaultCoverImage = "https://images.unsplash.com/photo-1576633587382-13ddf37b1fc1?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="space-y-4">
      {/* Cover Image with Overlay */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden rounded-xl mb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 z-10"></div>
        <img 
          src={defaultCoverImage} 
          alt="Cover" 
          className="w-full h-full object-cover"
        />
        
        {/* Avatar + Name positioned over cover image */}
        <div className="absolute -bottom-12 left-0 right-0 flex flex-col items-center z-20">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.username || 'User avatar'} />
            ) : (
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {profile.username?.[0]?.toUpperCase() || profile.full_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="mt-2 text-center">
            <h1 className="text-2xl font-bold drop-shadow-md">{profile.full_name || profile.username}</h1>
            {profile.username && <p className="text-muted-foreground drop-shadow-md">@{profile.username}</p>}
          </div>
        </div>
        
        {/* Action buttons - positioned top right */}
        <div className="absolute top-4 right-4 z-20">
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
      
      {profile.bio && (
        <div className="mt-4">
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
