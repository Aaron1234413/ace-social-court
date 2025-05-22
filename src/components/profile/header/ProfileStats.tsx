
import { ProfileStatCard } from './ProfileStatCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfileStatsProps {
  userId: string;
}

export const ProfileStats = ({ userId }: ProfileStatsProps) => {
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

  return (
    <div className="flex flex-wrap justify-center gap-4 my-8">
      <ProfileStatCard 
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        } 
        count={followingCount || 0} 
        label="Following" 
        href={`/profile/${userId}/following`}
      />
      <ProfileStatCard 
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users-round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>
        } 
        count={followersCount || 0} 
        label="Followers" 
        href={`/profile/${userId}/followers`}
      />
      <ProfileStatCard 
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
        } 
        count={matchesCount || 0} 
        label="Matches" 
        href={`/profile/${userId}/matches`}
      />
      <ProfileStatCard 
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
        } 
        count={sessionsCount || 0} 
        label="Sessions" 
        href={`/profile/${userId}/sessions`}
      />
    </div>
  );
};
