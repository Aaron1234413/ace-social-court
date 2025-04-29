import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

// Import refactored components
import MapView from '@/components/map/MapView';
import MapFiltersSheet from '@/components/map/MapFiltersSheet';
import NearbyUsersList from '@/components/map/NearbyUsersList';
import LocationStatusCard from '@/components/map/LocationStatusCard';
import { NearbyUser } from '@/components/map/NearbyUsersLayer';
import NearbyCourtsPanel from '@/components/map/NearbyCourtsPanel';
import TennisCourtCard from '@/components/map/TennisCourtCard';
import { TennisCourt } from '@/components/map/TennisCourtsLayer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
  showOwnLocation: boolean;
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
    showOwnLocation: true,
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
  const [selectedCourt, setSelectedCourt] = useState<TennisCourt | null>(null);
  const [activeTab, setActiveTab] = useState<'people' | 'courts'>('people');
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shouldFallbackToAllCourts, setShouldFallbackToAllCourts] = useState(false);
  
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

  // Query for nearby tennis courts
  const { data: nearbyCourts, isLoading: isLoadingCourts, refetch: refetchCourts } = useQuery({
    queryKey: ['nearby-tennis-courts', userPosition, filters.distance, filters.showCourts, shouldFallbackToAllCourts],
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
          const { data, error } = await supabase
            .from('tennis_courts')
            .select('*')
            .limit(50);
          
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

  // Query for the user's own profile location
  const { data: userProfileLocation } = useQuery({
    queryKey: ['user-profile-location', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, location_name')
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
    
    // Add the user's own profile location if it exists and the filter is enabled
    if (userProfileLocation && filters.showOwnLocation) {
      uniqueUsers.set(userProfileLocation.id, userProfileLocation as NearbyUser);
    }
    
    return Array.from(uniqueUsers.values());
  }, [nearbyActiveUsers, staticLocationUsers, userProfileLocation, filters.showOwnLocation]);
  
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
    
    // If we're changing the court visibility and turning it on, switch to courts tab
    if (key === 'showCourts' && value === true) {
      setActiveTab('courts');
    }
    // If we're turning off court visibility, switch to people tab
    else if (key === 'showCourts' && value === false) {
      setActiveTab('people');
    }
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
        } else if (result.state === 'denied') {
          setLocationError('Location access denied. Enable location services to find nearby tennis courts.');
          setShouldFallbackToAllCourts(true);
        }
        
        result.addEventListener('change', function() {
          setUserLocationEnabled(result.state === 'granted');
          if (result.state === 'denied') {
            setLocationError('Location access denied. Enable location services to find nearby tennis courts.');
            setShouldFallbackToAllCourts(true);
          } else {
            setLocationError(null);
          }
        });
      }).catch(err => {
        console.error('Error checking location permission:', err);
        setLocationError('Could not determine location permission status.');
        setShouldFallbackToAllCourts(true);
      });
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setShouldFallbackToAllCourts(true);
    }
  }, []);

  // Set a timeout to switch to fallback mode if location isn't obtained after 10 seconds
  useEffect(() => {
    if (!userPosition && !shouldFallbackToAllCourts && filters.showCourts) {
      const timeoutId = setTimeout(() => {
        setShouldFallbackToAllCourts(true);
        toast.info("Using all courts instead of nearby courts due to location timeout.");
      }, 15000); // 15 seconds timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [userPosition, shouldFallbackToAllCourts, filters.showCourts]);

  const handleUserPositionUpdate = async (position: {lng: number, lat: number}) => {
    setUserPosition(position);
    setLocationError(null);
    
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
    setSelectedCourt(null); // Clear selected court
    setActiveTab('people');
    
    // If map instance exists, fly to the user's location
    if (mapInstance && user.latitude && user.longitude) {
      mapInstance.flyTo({
        center: [user.longitude, user.latitude],
        zoom: 14,
        essential: true
      });
    }
  };
  
  const handleCourtSelect = (court: TennisCourt) => {
    setSelectedCourt(court);
    setSelectedUser(null); // Clear selected user
    setActiveTab('courts');
    
    // If map instance exists, fly to the court's location
    if (mapInstance && court.latitude && court.longitude) {
      mapInstance.flyTo({
        center: [court.longitude, court.latitude],
        zoom: 16, // Zoom in closer for courts
        essential: true
      });
    }
  };

  // If we have the user's profile location and there's a map instance, offer to show it
  useEffect(() => {
    if (mapInstance && userProfileLocation && filters.showOwnLocation && !userPosition) {
      // Only show this once when the map loads
      const timer = setTimeout(() => {
        toast.info(
          <div className="cursor-pointer" onClick={() => handleUserSelect(userProfileLocation)}>
            Click to view your profile location
          </div>,
          { duration: 5000 }
        );
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [mapInstance, userProfileLocation, filters.showOwnLocation, userPosition]);

  // Function to retry court fetching when it fails
  const handleRetryCourts = () => {
    setLocationError(null);
    refetchCourts();
  };

  // Function to manually switch to fallback mode
  const showAllCourts = () => {
    setShouldFallbackToAllCourts(true);
    toast.info("Showing all tennis courts instead of nearby courts.");
  };

  return (
    <div className="container py-4 px-4 md:px-6">
      {/* Keep existing code (header and filters) */}
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
      
      {locationError && (
        <div className="mb-4">
          <Alert variant="destructive" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-amber-800">
              {locationError}
              {!shouldFallbackToAllCourts && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={showAllCourts} 
                  className="ml-2 text-xs"
                >
                  Show All Courts
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MapView 
            isReady={isReady}
            locationPrivacy={locationPrivacy}
            onMapInitialized={setMapInstance}
            onUserPositionUpdate={handleUserPositionUpdate}
            mapInstance={mapInstance}
            nearbyUsers={nearbyUsers}
            nearbyCourts={nearbyCourts}
            filters={{
              showPlayers: filters.showPlayers,
              showCoaches: filters.showCoaches,
              showCourts: filters.showCourts,
              showOwnLocation: filters.showOwnLocation
            }}
            onSelectUser={handleUserSelect}
            onSelectCourt={handleCourtSelect}
          />
        </div>
        
        <div className="space-y-4">
          <div className="border-b border-gray-200 flex mb-4">
            <button
              onClick={() => setActiveTab('people')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'people' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground'
              }`}
            >
              People
            </button>
            <button
              onClick={() => setActiveTab('courts')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'courts' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground'
              }`}
            >
              Courts
            </button>
          </div>
          
          {activeTab === 'people' ? (
            <>
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
                profileLocation={userProfileLocation}
                onViewProfileLocation={() => userProfileLocation && handleUserSelect(userProfileLocation)}
              />
              
              {selectedUser && (
                <div className="bg-background rounded-lg border shadow-sm p-4">
                  <h3 className="font-semibold mb-2">{selectedUser.full_name || selectedUser.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.user_type === 'coach' ? 'Tennis Coach' : 'Tennis Player'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <NearbyCourtsPanel
                courts={nearbyCourts || []}
                isLoading={isLoadingCourts && !shouldFallbackToAllCourts}
                onCourtSelect={handleCourtSelect}
                onRetry={handleRetryCourts}
              />
              
              {selectedCourt && (
                <TennisCourtCard
                  court={selectedCourt}
                  onViewOnMap={() => {
                    if (mapInstance && selectedCourt.latitude && selectedCourt.longitude) {
                      mapInstance.flyTo({
                        center: [selectedCourt.longitude, selectedCourt.latitude],
                        zoom: 16,
                        essential: true
                      });
                    }
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapExplorer;
