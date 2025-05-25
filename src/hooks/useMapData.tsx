import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import { NearbyUser } from '@/components/map/NearbyUsersLayer';
import React from 'react';

// Simple haversine distance calculation (like the Supabase function but in JS)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c;
  return d;
};

const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

export const useMapData = () => {
  const { 
    user, 
    userPosition, 
    filters, 
    shouldFallbackToAllCourts, 
    courtsPage, 
    courtsPerPage 
  } = useMapExplorer();

  // Query for users that the current user is following
  const { data: followingUsers, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following-users-with-locations', user?.id, filters.showFollowing],
    queryFn: async () => {
      if (!user || !filters.showFollowing) {
        return [];
      }
      
      try {
        // Get all users I'm following
        const { data: followingData, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id);
        
        if (followingError) {
          console.error('Error fetching following relationships:', followingError);
          return [];
        }

        if (!followingData || followingData.length === 0) {
          return [];
        }

        const followingIds = followingData.map(f => f.following_id);
        
        // Get profiles of followed users with location data
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, location_name, skill_level')
          .in('id', followingIds)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
        
        if (profilesError) {
          console.error('Error fetching followed users profiles:', profilesError);
          return [];
        }

        // Apply filters and calculate distance if user position is available
        let filteredProfiles = (profiles || []).filter(profile => {
          // Filter by user type
          if (!(profile.user_type === 'player' && filters.showPlayers) && 
              !(profile.user_type === 'coach' && filters.showCoaches)) {
            return false;
          }
          
          // Filter by skill level if specified
          if (filters.skillLevel && profile.skill_level !== filters.skillLevel) {
            return false;
          }
          
          return true;
        });

        // Add distance and other properties
        return filteredProfiles.map(profile => {
          const distance = userPosition 
            ? calculateDistance(userPosition.lat, userPosition.lng, profile.latitude!, profile.longitude!)
            : 0;
            
          return {
            ...profile,
            distance,
            is_following: true
          } as NearbyUser;
        }).filter(user => !userPosition || user.distance <= filters.distance);
        
      } catch (err) {
        console.error('Exception fetching following users:', err);
        return [];
      }
    },
    enabled: !!user && filters.showFollowing,
  });

  // Query for nearby users using our Supabase function
  const { data: nearbyActiveUsers, isLoading: isLoadingNearbyUsers } = useQuery({
    queryKey: ['nearby-active-users', userPosition, filters.distance, filters.showPlayers, filters.showCoaches, filters.skillLevel],
    queryFn: async () => {
      if (!userPosition) return [];
      
      try {
        // Since our Supabase function may not be updated to include skill_level yet,
        // we'll query the profiles directly to get skill levels
        const { data: activeUsers, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, skill_level')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .is('location_privacy->showOnMap', true);
        
        if (error) {
          console.error('Error fetching nearby users:', error);
          toast.error('Failed to find nearby players and coaches');
          return [];
        }
        
        // Filter by distance
        const usersWithDistance = activeUsers
          .filter(user => {
            // Filter by user type
            if (!(user.user_type === 'player' && filters.showPlayers) && 
                !(user.user_type === 'coach' && filters.showCoaches)) {
              return false;
            }
            
            return true;
          })
          .map(user => {
            const distance = calculateDistance(
              userPosition.lat, userPosition.lng, 
              user.latitude!, user.longitude!
            );
            
            return {
              ...user,
              distance
            };
          })
          .filter(user => user.distance <= filters.distance);
        
        // Apply skill level filter here
        let filteredData = usersWithDistance;
        if (filters.skillLevel) {
          filteredData = filteredData.filter(user => 
            !filters.skillLevel || user.skill_level === filters.skillLevel
          );
        }
        
        return filteredData;
      } catch (err) {
        console.error('Exception fetching nearby users:', err);
        return [];
      }
    },
    enabled: !!userPosition,
  });

  // Query for nearby tennis courts
  const { data: nearbyCourts, isLoading: isLoadingCourts, refetch: refetchCourts } = useQuery({
    queryKey: ['nearby-tennis-courts', userPosition, filters.distance, filters.showCourts, shouldFallbackToAllCourts, filters.state, courtsPage],
    queryFn: async () => {
      if (!filters.showCourts) return [];
      
      try {
        // If user position is available, use it to find nearby courts
        if (userPosition) {
          const { data, error } = await supabase.rpc('find_nearby_courts', {
            user_lat: userPosition.lat,
            user_lng: userPosition.lng,
            distance_miles: filters.distance
          });
          
          if (error) {
            console.error('Error fetching nearby courts:', error);
            toast.error('Failed to find nearby tennis courts');
            return [];
          }
          
          return data || [];
        } 
        // Fallback: If user position is not available but fallback is enabled, fetch all courts
        else if (shouldFallbackToAllCourts) {
          let query = supabase
            .from('tennis_courts')
            .select('*');
          
          // Apply state filter if specified
          if (filters.state) {
            query = query.ilike('state', filters.state);
          }
          
          // Add pagination
          const { data, error } = await query
            .range((courtsPage - 1) * courtsPerPage, courtsPage * courtsPerPage - 1)
            .order('name');
          
          if (error) {
            console.error('Error fetching all courts:', error);
            toast.error('Failed to find tennis courts');
            return [];
          }
          
          // Add a default distance property to each court for consistency
          return (data || []).map(court => ({
            ...court,
            distance: 0 // Default distance when we don't have user location
          }));
        }
        
        return [];
      } catch (err) {
        console.error('Exception fetching courts:', err);
        return [];
      }
    },
    enabled: filters.showCourts && (!!userPosition || shouldFallbackToAllCourts),
  });

  // Query for total number of courts (for pagination)
  const { data: totalCourts } = useQuery({
    queryKey: ['total-courts', filters.state],
    queryFn: async () => {
      if (shouldFallbackToAllCourts) {
        let query = supabase
          .from('tennis_courts')
          .select('id', { count: 'exact' });
        
        // Apply state filter if specified
        if (filters.state) {
          query = query.ilike('state', filters.state);
        }
        
        const { count, error } = await query;
        
        if (error) {
          console.error('Error counting courts:', error);
          return 0;
        }
        
        return count || 0;
      }
      return 0;
    },
    enabled: shouldFallbackToAllCourts,
  });

  const totalPages = Math.ceil((totalCourts || 0) / courtsPerPage);

  // Query for available states to filter by
  const { data: availableStates } = useQuery({
    queryKey: ['available-states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tennis_courts')
        .select('state')
        .not('state', 'is', null)
        .order('state');
      
      if (error) {
        console.error('Error fetching states:', error);
        return [];
      }
      
      // Extract unique states
      const states = Array.from(new Set(data.map(item => item.state)));
      return states.filter(state => !!state);
    },
  });

  // Query for the user's own profile location
  const { data: userProfileLocation } = useQuery({
    queryKey: ['user-profile-location', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, location_name, skill_level')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile location:', error);
          return null;
        }
        
        if (data && data.latitude && data.longitude) {
          return {
            ...data,
            is_static_location: true,
            is_own_profile: true,
            distance: 0
          };
        }
        
        return null;
      } catch (err) {
        console.error('Exception fetching user profile location:', err);
        return null;
      }
    },
    enabled: !!user && filters.showOwnLocation,
  });

  // Query for users with static locations (from profiles)
  const { data: staticLocationUsers } = useQuery({
    queryKey: ['static-location-users', userPosition, filters.distance, filters.showPlayers, filters.showCoaches, filters.showStaticLocations, filters.skillLevel],
    queryFn: async () => {
      if (!userPosition || !filters.showStaticLocations) return [];
      
      try {
        // This query gets users who have a location set in their profile
        // but may not be actively sharing their location
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, location_name, skill_level')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .not('location_name', 'is', null);
        
        if (error) {
          console.error('Error fetching static location users:', error);
          return [];
        }
        
        // Filter by user type
        let filteredUsers = (data || []).filter(user => 
          (user.user_type === 'player' && filters.showPlayers) || 
          (user.user_type === 'coach' && filters.showCoaches)
        );
        
        // Filter by skill level if specified
        if (filters.skillLevel) {
          filteredUsers = filteredUsers.filter(user => 
            !filters.skillLevel || user.skill_level === filters.skillLevel
          );
        }
        
        // Calculate distance
        return filteredUsers.map(user => ({
          ...user,
          is_static_location: true,
          distance: calculateDistance(
            userPosition.lat, userPosition.lng, 
            user.latitude!, user.longitude!
          )
        })).filter(user => user.distance <= filters.distance);
      } catch (err) {
        console.error('Exception fetching static location users:', err);
        return [];
      }
    },
    enabled: !!userPosition && filters.showStaticLocations,
  });
  
  // Simplified combine logic
  const nearbyUsers: NearbyUser[] = React.useMemo(() => {
    // If showing following filter is enabled, ONLY show followed users
    if (filters.showFollowing) {
      return followingUsers || [];
    }
    
    // Otherwise, show normal users with following status marked
    const activeUsers = nearbyActiveUsers || [];
    const staticUsers = staticLocationUsers || [];
    const followingIds = new Set((followingUsers || []).map(u => u.id));
    
    const uniqueUsers = new Map<string, NearbyUser>();
    
    // Add active users
    activeUsers.forEach(user => {
      uniqueUsers.set(user.id, {
        ...user,
        is_following: followingIds.has(user.id)
      });
    });
    
    // Add static users
    staticUsers.forEach(user => {
      if (!uniqueUsers.has(user.id)) {
        uniqueUsers.set(user.id, {
          ...user,
          is_following: followingIds.has(user.id)
        } as NearbyUser);
      }
    });
    
    // Add own profile if enabled
    if (userProfileLocation && filters.showOwnLocation) {
      uniqueUsers.set(userProfileLocation.id, userProfileLocation as NearbyUser);
    }
    
    return Array.from(uniqueUsers.values());
  }, [nearbyActiveUsers, staticLocationUsers, userProfileLocation, followingUsers, filters.showOwnLocation, filters.showFollowing]);
  
  return {
    nearbyUsers,
    isLoadingNearbyUsers: isLoadingNearbyUsers || isLoadingFollowing,
    nearbyCourts,
    isLoadingCourts,
    refetchCourts,
    totalCourts,
    totalPages,
    availableStates,
    followingUsersCount: followingUsers?.length || 0,
    isLoadingFollowing,
    userProfileLocation
  };
};
