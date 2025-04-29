
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

// Import refactored components
import MapView from '@/components/map/MapView';
import MapFiltersSheet from '@/components/map/MapFiltersSheet';
import NearbyUsersList from '@/components/map/NearbyUsersList';
import LocationStatusCard from '@/components/map/LocationStatusCard';
import { NearbyUser } from '@/components/map/NearbyUsersLayer';

// Define types
interface LocationPrivacySettings {
  shareExactLocation: boolean;
  showOnMap: boolean;
  locationHistory: boolean;
}

interface FilterSettings {
  showCourts: boolean;
  showPlayers: boolean;
  showCoaches: boolean;
  showEvents: boolean;
  showStaticLocations: boolean;
  distance: number; // in miles
}

interface StaticLocationUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  distance?: number;
  is_static_location?: boolean;
}

const MapExplorer = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterSettings>({
    showCourts: true,
    showPlayers: true,
    showCoaches: true,
    showEvents: true,
    showStaticLocations: true,
    distance: 25, // in miles
  });
  
  const [isReady, setIsReady] = useState(false);
  const [userLocationEnabled, setUserLocationEnabled] = useState(false);
  const [locationPrivacy, setLocationPrivacy] = useState<LocationPrivacySettings>({
    shareExactLocation: false,
    showOnMap: false,
    locationHistory: false,
  });
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [userPosition, setUserPosition] = useState<{lng: number, lat: number} | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Query for nearby users using our Supabase function
  const { data: nearbyActiveUsers, isLoading: isLoadingNearbyUsers } = useQuery({
    queryKey: ['nearby-active-users', userPosition, filters.distance, filters.showPlayers, filters.showCoaches],
    queryFn: async () => {
      if (!userPosition) return [];
      
      try {
        const { data, error } = await supabase.rpc('find_nearby_users', {
          user_lat: userPosition.lat,
          user_lng: userPosition.lng,
          distance_miles: filters.distance,
          show_players: filters.showPlayers,
          show_coaches: filters.showCoaches
        });
        
        if (error) {
          console.error('Error fetching nearby users:', error);
          toast.error('Failed to find nearby players and coaches');
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.error('Exception fetching nearby users:', err);
        return [];
      }
    },
    enabled: !!userPosition,
  });

  // Query for users with static locations (from profiles)
  const { data: staticLocationUsers } = useQuery({
    queryKey: ['static-location-users', userPosition, filters.distance, filters.showPlayers, filters.showCoaches, filters.showStaticLocations],
    queryFn: async () => {
      if (!userPosition || !filters.showStaticLocations) return [];
      
      try {
        // This query gets users who have a location set in their profile
        // but may not be actively sharing their location
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, location_name')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .not('location_name', 'is', null)
          .filter('location_privacy', 'not.eq', JSON.stringify({showOnMap: true}))
          .order('username');
        
        if (error) {
          console.error('Error fetching static location users:', error);
          return [];
        }
        
        // Filter by user type
        const filteredUsers = (data || []).filter(user => 
          (user.user_type === 'player' && filters.showPlayers) || 
          (user.user_type === 'coach' && filters.showCoaches)
        );
        
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
  
  // Simple haversine distance calculation (like the Supabase function but in JS)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  
  // Combine active and static users, removing duplicates
  const nearbyUsers: NearbyUser[] = React.useMemo(() => {
    const activeUsers = nearbyActiveUsers || [];
    const staticUsers = staticLocationUsers || [];
    
    // Use a Map to track unique users by ID
    const uniqueUsers = new Map<string, NearbyUser>();
    
    // Add active users first
    activeUsers.forEach(user => {
      uniqueUsers.set(user.id, user);
    });
    
    // Then add static users, but only if they don't already exist
    staticUsers.forEach(user => {
      if (!uniqueUsers.has(user.id)) {
        uniqueUsers.set(user.id, user as NearbyUser);
      }
    });
    
    return Array.from(uniqueUsers.values());
  }, [nearbyActiveUsers, staticLocationUsers]);
  
  // Query for user's location privacy settings
  const { data: userPrivacySettings } = useQuery({
    queryKey: ['user-location-privacy', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('location_privacy')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching privacy settings:', error);
        return null;
      }
      
      return data?.location_privacy || {
        shareExactLocation: false,
        showOnMap: false,
        locationHistory: false
      };
    },
    enabled: !!user,
  });
  
  // Update location privacy settings in state when data loads
  useEffect(() => {
    if (userPrivacySettings) {
      // Parse JSON data if it's a string
      let settingsObj: any;
      
      try {
        // If it's a string, try to parse it
        if (typeof userPrivacySettings === 'string') {
          settingsObj = JSON.parse(userPrivacySettings);
        } else {
          // Otherwise use it directly
          settingsObj = userPrivacySettings;
        }
        
        // Create safe settings object with fallbacks
        const safeSettings: LocationPrivacySettings = {
          shareExactLocation: typeof settingsObj?.shareExactLocation === 'boolean' 
            ? settingsObj.shareExactLocation 
            : false,
          showOnMap: typeof settingsObj?.showOnMap === 'boolean' 
            ? settingsObj.showOnMap 
            : false,
          locationHistory: typeof settingsObj?.locationHistory === 'boolean' 
            ? settingsObj.locationHistory 
            : false
        };
        
        setLocationPrivacy(safeSettings);
      } catch (e) {
        console.error('Failed to parse privacy settings:', e);
        // Use default settings if parsing fails
        setLocationPrivacy({
          shareExactLocation: false,
          showOnMap: false,
          locationHistory: false
        });
      }
    }
  }, [userPrivacySettings]);
  
  useEffect(() => {
    // Ensure the component is fully mounted
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleFilterChange = (key: keyof FilterSettings, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePrivacySetting = async (key: keyof LocationPrivacySettings) => {
    if (!user) {
      toast.error('You must be logged in to change privacy settings');
      return;
    }
    
    const newSettings = {
      ...locationPrivacy,
      [key]: !locationPrivacy[key]
    };
    
    // If they disable showing on map, also disable exact location sharing
    if (key === 'showOnMap' && !newSettings.showOnMap) {
      newSettings.shareExactLocation = false;
    }
    
    // If they enable exact location, also enable showing on map
    if (key === 'shareExactLocation' && newSettings.shareExactLocation) {
      newSettings.showOnMap = true;
    }
    
    // Update state immediately for responsive UI
    setLocationPrivacy(newSettings);
    
    // Show toast for changes
    toast.info(`Location ${key} ${newSettings[key] ? 'enabled' : 'disabled'}`);
    
    // Update in database
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          location_privacy: newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving privacy settings:', error);
        toast.error('Failed to save privacy settings');
        // Revert state if save fails
        setLocationPrivacy(locationPrivacy);
      }
    } catch (err) {
      console.error('Exception saving privacy settings:', err);
      toast.error('Failed to save privacy settings');
      // Revert state if save fails
      setLocationPrivacy(locationPrivacy);
    }
  };

  useEffect(() => {
    // Request user location permission
    if (navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setUserLocationEnabled(true);
        }
        
        result.addEventListener('change', function() {
          setUserLocationEnabled(result.state === 'granted');
        });
      });
    }
  }, []);

  const handleUserPositionUpdate = async (position: {lng: number, lat: number}) => {
    setUserPosition(position);
    
    // If user is logged in, update their location in the database
    if (user && locationPrivacy.showOnMap) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            latitude: position.lat,
            longitude: position.lng,
            location_updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating user location:', error);
        }
      } catch (err) {
        console.error('Exception updating user location:', err);
      }
    }
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    
    // If map instance exists, fly to the user's location
    if (mapInstance && user.latitude && user.longitude) {
      mapInstance.flyTo({
        center: [user.longitude, user.latitude],
        zoom: 14,
        essential: true
      });
    }
  };

  return (
    <div className="container py-4 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tennis Map</h1>
          <p className="text-muted-foreground">Find courts, players, and coaches near you</p>
        </div>
        
        <MapFiltersSheet 
          filters={filters}
          onFilterChange={handleFilterChange}
          locationPrivacy={locationPrivacy}
          onPrivacyChange={togglePrivacySetting}
          userLocationEnabled={userLocationEnabled}
          isUserLoggedIn={!!user}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MapView 
            isReady={isReady}
            locationPrivacy={locationPrivacy}
            onMapInitialized={setMapInstance}
            onUserPositionUpdate={handleUserPositionUpdate}
            mapInstance={mapInstance}
            nearbyUsers={nearbyUsers}
            filters={{
              showPlayers: filters.showPlayers,
              showCoaches: filters.showCoaches
            }}
            onSelectUser={handleUserSelect}
          />
        </div>
        
        <div className="space-y-4">
          <NearbyUsersList 
            users={nearbyUsers || []}
            isLoading={isLoadingNearbyUsers || !userPosition}
            onUserSelect={handleUserSelect}
          />
          
          <LocationStatusCard 
            isLoggedIn={!!user}
            userLocationEnabled={userLocationEnabled}
            locationPrivacy={locationPrivacy}
            userPosition={userPosition}
            mapInstance={mapInstance}
          />
        </div>
      </div>
    </div>
  );
};

export default MapExplorer;
