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

  // DIAGNOSTIC LOGGING - Always runs to help debug following issues
  React.useEffect(() => {
    console.log('🚨 FOLLOWING DIAGNOSTIC START 🚨');
    console.log('   - Current user:', user?.id || 'NOT LOGGED IN');
    console.log('   - Show following filter:', filters.showFollowing);
    console.log('   - User position:', userPosition ? 'Available' : 'Not available');
  }, [user, filters.showFollowing, userPosition]);

  // Basic diagnostic query - always runs when user is logged in
  const { data: diagnosticData } = useQuery({
    queryKey: ['diagnostic-following', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('❌ DIAGNOSTIC: No user logged in');
        return null;
      }
      
      console.log('🔍 DIAGNOSTIC: Running basic following checks...');
      
      try {
        // Test 1: Check if followers table has any data at all
        console.log('📋 TEST 1: Checking followers table...');
        const { data: allFollowers, error: allError } = await supabase
          .from('followers')
          .select('*')
          .limit(10);
        
        console.log('   - All followers query result:', allFollowers);
        console.log('   - All followers error:', allError);
        
        // Test 2: Check if current user follows anyone
        console.log('📋 TEST 2: Checking if current user follows anyone...');
        const { data: myFollowing, error: myError } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', user.id);
        
        console.log('   - My following data:', myFollowing);
        console.log('   - My following error:', myError);
        console.log('   - I am following', myFollowing?.length || 0, 'people');
        
        // Test 3: Check specific user IDs I'm following
        if (myFollowing && myFollowing.length > 0) {
          const followingIds = myFollowing.map(f => f.following_id);
          console.log('   - Following these user IDs:', followingIds);
          
          // Test 4: Check if followed users have profiles
          console.log('📋 TEST 3: Checking profiles of followed users...');
          const { data: followedProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, username, latitude, longitude')
            .in('id', followingIds);
          
          console.log('   - Followed users profiles:', followedProfiles);
          console.log('   - Profiles error:', profilesError);
          
          if (followedProfiles) {
            followedProfiles.forEach(profile => {
              console.log(`   - ${profile.full_name || profile.username} (${profile.id}): Location ${profile.latitude ? 'Available' : 'NOT SET'}`);
            });
          }
        }
        
        return { allFollowers, myFollowing };
      } catch (err) {
        console.error('💥 DIAGNOSTIC ERROR:', err);
        return null;
      }
    },
    enabled: !!user,
  });

  // Log when showFollowing filter changes
  React.useEffect(() => {
    if (filters.showFollowing) {
      console.log('🎯 FOLLOWING FILTER ENABLED - Should show only followed users');
    } else {
      console.log('🎯 FOLLOWING FILTER DISABLED - Should show all users');
    }
  }, [filters.showFollowing]);

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
  
  // ENHANCED Query for users that the current user is following
  const { data: followingData } = useQuery({
    queryKey: ['following-users', user?.id, filters.showFollowing],
    queryFn: async () => {
      if (!user) {
        console.log('⚠️ FOLLOWING QUERY: No user logged in');
        return [];
      }
      
      console.log('🔍 FOLLOWING QUERY: Fetching following users for user:', user.id);
      console.log('🔍 FOLLOWING QUERY: showFollowing filter is:', filters.showFollowing);
      
      try {
        const { data: directData, error: directError } = await supabase
          .from('followers')
          .select('following_id, follower_id, created_at')
          .eq('follower_id', user.id);
        
        console.log('📊 FOLLOWING QUERY Results:');
        console.log('   - Raw data:', directData);
        console.log('   - Error:', directError);
        console.log('   - Count:', directData?.length || 0);
        
        if (directError) {
          console.error('❌ FOLLOWING QUERY Error:', directError);
          return [];
        }
        
        const followingIds = directData?.map(row => row.following_id) || [];
        console.log('✅ FOLLOWING QUERY: Following user IDs:', followingIds);
        
        return followingIds;
      } catch (err) {
        console.error('💥 FOLLOWING QUERY Exception:', err);
        return [];
      }
    },
    enabled: !!user,
  });

  // NEW QUERY: Fetch location data for all users being followed
  const { data: followedUsersLocations } = useQuery({
    queryKey: ['followed-users-locations', followingData],
    queryFn: async () => {
      if (!followingData || followingData.length === 0) {
        console.log('⚠️ FOLLOWED LOCATIONS: No following data available');
        return [];
      }
      
      console.log('🔍 FOLLOWED LOCATIONS: Fetching locations for user IDs:', followingData);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, location_name, skill_level')
          .in('id', followingData)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
        
        if (error) {
          console.error('❌ FOLLOWED LOCATIONS Error:', error);
          return [];
        }

        console.log('✅ FOLLOWED LOCATIONS: Found', data?.length || 0, 'followed users with locations');
        
        if (data) {
          data.forEach(user => {
            console.log(`📍 FOLLOWED USER: ${user.full_name || user.username} (${user.id}) at lat:${user.latitude}, lng:${user.longitude}`);
          });
        }
        
        // Add is_following flag and calculate distance if user position is available
        return data.map(user => {
          const distance = userPosition 
            ? calculateDistance(userPosition.lat, userPosition.lng, user.latitude!, user.longitude!)
            : 0;
            
          return {
            ...user,
            distance,
            is_following: true
          };
        });
      } catch (err) {
        console.error('💥 FOLLOWED LOCATIONS Exception:', err);
        return [];
      }
    },
    enabled: !!followingData && followingData.length > 0,
  });
  
  // Enhanced combine logic with detailed logging
  const nearbyUsers: NearbyUser[] = React.useMemo(() => {
    console.log('🔄 COMBINING USERS: Starting combination process');
    
    const activeUsers = nearbyActiveUsers || [];
    const staticUsers = staticLocationUsers || [];
    const followingIds = new Set(followingData || []);
    const followedUsers = followedUsersLocations || [];
    
    console.log('📊 COMBINING USERS: Data summary:');
    console.log('   - Active users:', activeUsers.length);
    console.log('   - Static users:', staticUsers.length);
    console.log('   - Following IDs:', Array.from(followingIds));
    console.log('   - Followed users with locations:', followedUsers.length);
    console.log('   - Show following filter:', filters.showFollowing);
    
    const uniqueUsers = new Map<string, NearbyUser>();
    
    // Add followed users first if filter is enabled
    if (filters.showFollowing) {
      console.log('✅ COMBINING: Adding followed users to map...');
      followedUsers.forEach(user => {
        console.log(`   + Adding followed user: ${user.full_name || user.username} (${user.id})`);
        uniqueUsers.set(user.id, {
          ...user,
          is_following: true
        });
      });
    }
    
    // Add active users
    activeUsers.forEach(user => {
      const isFollowing = followingIds.has(user.id);
      console.log(`🔍 Active user ${user.id} (${user.full_name || user.username}) is followed: ${isFollowing}`);
      uniqueUsers.set(user.id, {
        ...user,
        is_following: isFollowing
      });
    });
    
    // Add static users
    staticUsers.forEach(user => {
      if (!uniqueUsers.has(user.id)) {
        const isFollowing = followingIds.has(user.id);
        console.log(`🔍 Static user ${user.id} (${user.full_name || user.username}) is followed: ${isFollowing}`);
        uniqueUsers.set(user.id, {
          ...user,
          is_following: isFollowing
        } as NearbyUser);
      }
    });
    
    // Add own profile if enabled
    if (userProfileLocation && filters.showOwnLocation) {
      console.log('✅ COMBINING: Adding own profile location');
      uniqueUsers.set(userProfileLocation.id, userProfileLocation as NearbyUser);
    }
    
    let users = Array.from(uniqueUsers.values());
    
    // Filter to only followed users if the filter is enabled
    if (filters.showFollowing) {
      console.log('🎯 COMBINING: Filtering to show only followed users...');
      const beforeFilter = users.length;
      users = users.filter(user => user.is_following || user.is_own_profile);
      console.log(`   - Before filter: ${beforeFilter} users`);
      console.log(`   - After filter: ${users.length} users`);
      
      if (users.length === 0) {
        console.log('⚠️ COMBINING: NO USERS AFTER FOLLOWING FILTER!');
        console.log('   - Check: Do you follow anyone with location data?');
        console.log('   - Check: Are their privacy settings allowing map display?');
      }
    }
    
    // Apply skill level filter if specified
    if (filters.skillLevel) {
      const beforeSkillFilter = users.length;
      users = users.filter(user => 
        !filters.skillLevel || user.skill_level === filters.skillLevel
      );
      console.log(`🎯 SKILL FILTER: ${beforeSkillFilter} → ${users.length} users`);
    }
    
    console.log('🎯 FINAL RESULT: Displaying', users.length, 'users on map');
    
    return users;
  }, [nearbyActiveUsers, staticLocationUsers, userProfileLocation, followedUsersLocations, followingData, filters.showOwnLocation, filters.showFollowing, filters.skillLevel]);
  
  return {
    nearbyUsers,
    isLoadingNearbyUsers,
    nearbyCourts,
    isLoadingCourts,
    refetchCourts,
    totalCourts,
    totalPages,
    availableStates,
    userProfileLocation
  };
};
