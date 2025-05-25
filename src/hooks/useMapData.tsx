
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

  console.log('🔍 useMapData: Current user:', user?.id);
  console.log('🔍 useMapData: Current filters:', filters);
  console.log('🔍 useMapData: showFollowing enabled:', filters.showFollowing);

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
  
  // IMPROVED Query for users that the current user is following
  const { data: followingData } = useQuery({
    queryKey: ['following-users', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        console.log('🔍 DIAGNOSTIC: Fetching following users for user:', user.id);
        
        // Method 1: Direct table query with detailed debugging
        console.log('📋 METHOD 1: Direct followers table query...');
        const { data: directData, error: directError } = await supabase
          .from('followers')
          .select('following_id, follower_id, created_at')
          .eq('follower_id', user.id);
        
        console.log('📊 DIRECT QUERY Results:');
        console.log('   - Raw data:', directData);
        console.log('   - Error:', directError);
        console.log('   - Count:', directData?.length || 0);
        
        if (directError) {
          console.error('❌ Direct query error details:', {
            message: directError.message,
            details: directError.details,
            hint: directError.hint,
            code: directError.code
          });
        }
        
        // Method 2: Test what data exists in followers table at all
        console.log('📋 METHOD 2: Check all followers data...');
        const { data: allFollowers, error: allError } = await supabase
          .from('followers')
          .select('*')
          .limit(10);
        
        console.log('📊 ALL FOLLOWERS in database (first 10):');
        console.log('   - Data:', allFollowers);
        console.log('   - Error:', allError);
        
        // Method 3: Test specific Brian relationship if we can find his ID
        console.log('📋 METHOD 3: Looking for Brian Peck specifically...');
        const { data: brianProfile } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .or('username.ilike.%brian%,full_name.ilike.%brian%')
          .limit(5);
        
        console.log('🔍 Found potential Brian profiles:', brianProfile);
        
        if (brianProfile && brianProfile.length > 0) {
          for (const profile of brianProfile) {
            console.log(`🧪 Testing RPC for ${profile.full_name || profile.username} (${profile.id})...`);
            const { data: rpcResult, error: rpcError } = await supabase
              .rpc('is_following', {
                follower_id: user.id,
                following_id: profile.id
              });
            
            console.log(`   - RPC Result: ${rpcResult}, Error: ${rpcError?.message || 'none'}`);
            
            // Also test direct query for this specific relationship
            const { data: directTest } = await supabase
              .from('followers')
              .select('*')
              .eq('follower_id', user.id)
              .eq('following_id', profile.id);
            
            console.log(`   - Direct Query Result: ${JSON.stringify(directTest)}`);
          }
        }
        
        console.log('✅ Diagnostic complete. Using direct query results.');
        return directData?.map(row => row.following_id) || [];
      } catch (err) {
        console.error('💥 Exception in following query:', err);
        return [];
      }
    },
    enabled: !!user && !!filters.showFollowing,
  });

  // NEW QUERY: Fetch location data for all users being followed
  const { data: followedUsersLocations } = useQuery({
    queryKey: ['followed-users-locations', followingData],
    queryFn: async () => {
      if (!followingData || followingData.length === 0) {
        console.log('⚠️ No following data available, followingData:', followingData);
        return [];
      }
      
      try {
        console.log('🔍 Fetching locations for followed user IDs:', followingData);
        
        // Get the profile data for all followed users
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, location_name, skill_level')
          .in('id', followingData)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
        
        if (error) {
          console.error('❌ Error fetching followed users locations:', error);
          return [];
        }

        console.log('✅ Fetched locations for followed users:', data);
        console.log('📍 Number of followed users with locations:', data?.length || 0);
        
        // Add is_following flag and calculate distance if user position is available
        return data.map(user => {
          const distance = userPosition 
            ? calculateDistance(userPosition.lat, userPosition.lng, user.latitude!, user.longitude!)
            : 0;
            
          console.log(`📍 Followed user ${user.full_name || user.username} (${user.id}) at distance: ${distance.toFixed(2)} miles`);
            
          return {
            ...user,
            distance,
            is_following: true
          };
        });
      } catch (err) {
        console.error('💥 Exception fetching followed users locations:', err);
        return [];
      }
    },
    enabled: !!followingData && followingData.length > 0 && filters.showFollowing,
  });
  
  // Combine active, static and followed users, removing duplicates
  const nearbyUsers: NearbyUser[] = React.useMemo(() => {
    const activeUsers = nearbyActiveUsers || [];
    const staticUsers = staticLocationUsers || [];
    const followingIds = new Set(followingData || []);
    const followedUsers = followedUsersLocations || [];
    
    console.log('🔍 Combining users:');
    console.log('   - Following IDs:', Array.from(followingIds));
    console.log('   - Active users:', activeUsers.length);
    console.log('   - Static users:', staticUsers.length);
    console.log('   - Followed users with locations:', followedUsers.length);
    console.log('   - Following filter enabled:', filters.showFollowing);
    
    // Use a Map to track unique users by ID
    const uniqueUsers = new Map<string, NearbyUser>();
    
    // First add followed users if the filter is enabled
    if (filters.showFollowing) {
      console.log('✅ Adding followed users to map...');
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
      // Check if this user is being followed
      const isFollowing = followingIds.has(user.id);
      console.log(`🔍 Active user ${user.id} (${user.full_name || user.username}) is followed: ${isFollowing}`);
      uniqueUsers.set(user.id, {
        ...user,
        is_following: isFollowing
      });
    });
    
    // Then add static users, but only if they don't already exist
    staticUsers.forEach(user => {
      if (!uniqueUsers.has(user.id)) {
        // Check if this user is being followed
        const isFollowing = followingIds.has(user.id);
        console.log(`🔍 Static user ${user.id} (${user.full_name || user.username}) is followed: ${isFollowing}`);
        uniqueUsers.set(user.id, {
          ...user,
          is_following: isFollowing
        } as NearbyUser);
      }
    });
    
    // Add the user's own profile location if it exists and the filter is enabled
    if (userProfileLocation && filters.showOwnLocation) {
      console.log('✅ Adding own profile location');
      uniqueUsers.set(userProfileLocation.id, userProfileLocation as NearbyUser);
    }
    
    // Convert to array
    let users = Array.from(uniqueUsers.values());
    
    // If showing only following users, filter to just those
    if (filters.showFollowing) {
      console.log('🔍 Filtering to show only followed users...');
      const beforeFilter = users.length;
      users = users.filter(user => user.is_following || user.is_own_profile);
      console.log(`   - Before filter: ${beforeFilter} users`);
      console.log(`   - After filter: ${users.length} users`);
      console.log('   - Filtered users:', users.map(u => ({ id: u.id, name: u.full_name || u.username, is_following: u.is_following, is_own_profile: u.is_own_profile })));
    }
    
    // Filter by skill level if specified
    if (filters.skillLevel) {
      users = users.filter(user => 
        !filters.skillLevel || user.skill_level === filters.skillLevel
      );
    }
    
    console.log('🎯 Final users to display on map:', users.length);
    
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
