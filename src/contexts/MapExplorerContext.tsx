
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NearbyUser } from '@/components/map/NearbyUsersLayer';
import { TennisCourt } from '@/components/map/TennisCourtsLayer';

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
  showFollowing: boolean; 
  distance: number; // in miles
  state: string | null; // Filter for state
  skillLevel: string | null; // Filter for skill level
}

interface MapExplorerContextType {
  isReady: boolean;
  userLocationEnabled: boolean;
  locationPrivacy: LocationPrivacySettings;
  mapInstance: mapboxgl.Map | null;
  userPosition: { lng: number; lat: number } | null;
  filters: FilterSettings;
  selectedUser: NearbyUser | null;
  selectedCourt: TennisCourt | null;
  activeTab: 'people' | 'courts';
  locationError: string | null;
  shouldFallbackToAllCourts: boolean;
  courtsPage: number;
  courtsPerPage: number;
  user: any;
  userProfileLocation: any;
  setIsReady: (isReady: boolean) => void;
  setUserLocationEnabled: (enabled: boolean) => void;
  setLocationPrivacy: (settings: LocationPrivacySettings) => void;
  setMapInstance: (map: mapboxgl.Map | null) => void;
  setUserPosition: (position: { lng: number; lat: number } | null) => void;
  setFilters: (filters: FilterSettings) => void;
  setSelectedUser: (user: NearbyUser | null) => void;
  setSelectedCourt: (court: TennisCourt | null) => void;
  setActiveTab: (tab: 'people' | 'courts') => void;
  setLocationError: (error: string | null) => void;
  setShouldFallbackToAllCourts: (fallback: boolean) => void;
  setCourtsPage: (page: number) => void;
  handleFilterChange: (key: keyof FilterSettings, value: any) => void;
  togglePrivacySetting: (key: keyof LocationPrivacySettings) => void;
  handleUserPositionUpdate: (position: { lng: number; lat: number }) => void;
  handleUserSelect: (user: NearbyUser) => void;
  handleCourtSelect: (court: TennisCourt) => void;
  showAllCourts: () => void;
}

const MapExplorerContext = createContext<MapExplorerContextType | undefined>(undefined);

export const MapExplorerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [userLocationEnabled, setUserLocationEnabled] = useState(false);
  const [locationPrivacy, setLocationPrivacy] = useState<LocationPrivacySettings>({
    shareExactLocation: false,
    showOnMap: false,
    locationHistory: false,
  });
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [userPosition, setUserPosition] = useState<{ lng: number; lat: number } | null>(null);
  const [filters, setFilters] = useState<FilterSettings>({
    showCourts: true,
    showPlayers: true,
    showCoaches: true,
    showEvents: false,
    showStaticLocations: true,
    showOwnLocation: true,
    showFollowing: false,
    distance: 25, // in miles
    state: null, // Default to no state filter
    skillLevel: null, // Default to no skill level filter
  });
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<TennisCourt | null>(null);
  const [activeTab, setActiveTab] = useState<'people' | 'courts'>('people');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shouldFallbackToAllCourts, setShouldFallbackToAllCourts] = useState(false);
  const [courtsPage, setCourtsPage] = useState(1);
  const courtsPerPage = 50;
  const [userProfileLocation, setUserProfileLocation] = useState(null);

  // Query for user's location privacy settings
  useEffect(() => {
    if (!user) return;

    const fetchPrivacySettings = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('location_privacy')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching privacy settings:', error);
        return;
      }

      if (data?.location_privacy) {
        try {
          // Parse JSON data if it's a string
          let settingsObj: any;

          if (typeof data.location_privacy === 'string') {
            settingsObj = JSON.parse(data.location_privacy);
          } else {
            settingsObj = data.location_privacy;
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
        }
      }
    };

    fetchPrivacySettings();
  }, [user]);

  // Request user location permission
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setUserLocationEnabled(true);
        } else if (result.state === 'denied') {
          setLocationError('Location access denied. Enable location services to find nearby tennis courts.');
          setShouldFallbackToAllCourts(true);
        }

        result.addEventListener('change', function () {
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

  // Set a timeout to switch to fallback mode if location isn't obtained after 15 seconds
  useEffect(() => {
    if (!userPosition && !shouldFallbackToAllCourts && filters.showCourts) {
      const timeoutId = setTimeout(() => {
        setShouldFallbackToAllCourts(true);
        toast.info("Showing all tennis courts across the USA.");
      }, 15000); // 15 seconds timeout

      return () => clearTimeout(timeoutId);
    }
  }, [userPosition, shouldFallbackToAllCourts, filters.showCourts]);

  // Ensure the component is fully mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Fetch user profile location
  useEffect(() => {
    if (!user || !filters.showOwnLocation) return;

    const fetchUserProfileLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, latitude, longitude, location_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile location:', error);
          return;
        }

        if (data && data.latitude && data.longitude) {
          setUserProfileLocation({
            ...data,
            is_static_location: true,
            is_own_profile: true,
            distance: 0
          });
        }
      } catch (err) {
        console.error('Exception fetching user profile location:', err);
      }
    };

    fetchUserProfileLocation();
  }, [user, filters.showOwnLocation]);

  const handleFilterChange = (key: keyof FilterSettings, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));

    // Reset to page 1 when changing filters
    if (key === 'state') {
      setCourtsPage(1);
    }

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

  const handleUserPositionUpdate = async (position: { lng: number; lat: number }) => {
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

  const handleUserSelect = (user: NearbyUser) => {
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

  // Function to manually switch to fallback mode
  const showAllCourts = () => {
    setShouldFallbackToAllCourts(true);
    toast.info("Showing all tennis courts across the USA.");
  };

  return (
    <MapExplorerContext.Provider
      value={{
        isReady,
        userLocationEnabled,
        locationPrivacy,
        mapInstance,
        userPosition,
        filters,
        selectedUser,
        selectedCourt,
        activeTab,
        locationError,
        shouldFallbackToAllCourts,
        courtsPage,
        courtsPerPage,
        user,
        userProfileLocation,
        setIsReady,
        setUserLocationEnabled,
        setLocationPrivacy,
        setMapInstance,
        setUserPosition,
        setFilters,
        setSelectedUser,
        setSelectedCourt,
        setActiveTab,
        setLocationError,
        setShouldFallbackToAllCourts,
        setCourtsPage,
        handleFilterChange,
        togglePrivacySetting,
        handleUserPositionUpdate,
        handleUserSelect,
        handleCourtSelect,
        showAllCourts,
      }}
    >
      {children}
    </MapExplorerContext.Provider>
  );
};

export const useMapExplorer = () => {
  const context = useContext(MapExplorerContext);
  if (context === undefined) {
    throw new Error('useMapExplorer must be used within a MapExplorerProvider');
  }
  return context;
};
