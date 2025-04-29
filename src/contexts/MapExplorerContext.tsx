import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { NearbyUser } from '@/components/map/NearbyUsersLayer';
import { TennisCourt } from '@/components/map/TennisCourtsLayer';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// Define types
export interface LocationPrivacySettings {
  shareExactLocation: boolean;
  showOnMap: boolean;
  locationHistory: boolean;
}

export interface FilterSettings {
  showCourts: boolean;
  showPlayers: boolean;
  showCoaches: boolean;
  showEvents: boolean;
  showStaticLocations: boolean;
  showOwnLocation: boolean;
  showFollowing?: boolean; // Added for showing users being followed
  distance: number; // in miles
  state: string | null; // For state filter
}

export interface StaticLocationUser {
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

interface MapExplorerContextType {
  user: any;
  filters: FilterSettings;
  setFilters: React.Dispatch<React.SetStateAction<FilterSettings>>;
  isReady: boolean;
  userLocationEnabled: boolean;
  locationPrivacy: LocationPrivacySettings;
  setLocationPrivacy: React.Dispatch<React.SetStateAction<LocationPrivacySettings>>;
  mapInstance: mapboxgl.Map | null;
  setMapInstance: React.Dispatch<React.SetStateAction<mapboxgl.Map | null>>;
  userPosition: {lng: number, lat: number} | null;
  setUserPosition: React.Dispatch<React.SetStateAction<{lng: number, lat: number} | null>>;
  selectedUser: any;
  setSelectedUser: React.Dispatch<React.SetStateAction<any>>;
  selectedCourt: TennisCourt | null;
  setSelectedCourt: React.Dispatch<React.SetStateAction<TennisCourt | null>>;
  activeTab: 'people' | 'courts';
  setActiveTab: React.Dispatch<React.SetStateAction<'people' | 'courts'>>;
  locationError: string | null;
  setLocationError: React.Dispatch<React.SetStateAction<string | null>>;
  shouldFallbackToAllCourts: boolean;
  setShouldFallbackToAllCourts: React.Dispatch<React.SetStateAction<boolean>>;
  courtsPage: number;
  setCourtsPage: React.Dispatch<React.SetStateAction<number>>;
  courtsPerPage: number;
  togglePrivacySetting: (key: keyof LocationPrivacySettings) => Promise<void>;
  handleFilterChange: (key: keyof FilterSettings, value: any) => void;
  handleUserPositionUpdate: (position: {lng: number, lat: number}) => Promise<void>;
  handleUserSelect: (user: any) => void;
  handleCourtSelect: (court: TennisCourt) => void;
  showAllCourts: () => void;
}

const MapExplorerContext = createContext<MapExplorerContextType | undefined>(undefined);

export const useMapExplorer = () => {
  const context = useContext(MapExplorerContext);
  if (!context) {
    throw new Error('useMapExplorer must be used within a MapExplorerProvider');
  }
  return context;
};

export const MapExplorerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterSettings>({
    showCourts: true,
    showPlayers: true,
    showCoaches: true,
    showEvents: true,
    showStaticLocations: true,
    showOwnLocation: true,
    showFollowing: false, // Default to not showing just followed users
    distance: 25, // in miles
    state: null, // Default to no state filter
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
  const [courtsPage, setCourtsPage] = useState(1);
  const courtsPerPage = 50;

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

  // Set a timeout to switch to fallback mode if location isn't obtained after 15 seconds
  useEffect(() => {
    if (!userPosition && !shouldFallbackToAllCourts && filters.showCourts) {
      const timeoutId = setTimeout(() => {
        setShouldFallbackToAllCourts(true);
        toast.info("Using all courts across the USA.");
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

  // Function to manually switch to fallback mode
  const showAllCourts = () => {
    setShouldFallbackToAllCourts(true);
    toast.info("Showing all tennis courts across the USA.");
  };

  const value = {
    user,
    filters,
    setFilters,
    isReady,
    userLocationEnabled,
    locationPrivacy,
    setLocationPrivacy,
    mapInstance,
    setMapInstance,
    userPosition,
    setUserPosition,
    selectedUser,
    setSelectedUser,
    selectedCourt,
    setSelectedCourt,
    activeTab,
    setActiveTab,
    locationError,
    setLocationError,
    shouldFallbackToAllCourts,
    setShouldFallbackToAllCourts,
    courtsPage,
    setCourtsPage,
    courtsPerPage,
    togglePrivacySetting,
    handleFilterChange,
    handleUserPositionUpdate,
    handleUserSelect,
    handleCourtSelect,
    showAllCourts,
  };

  return (
    <MapExplorerContext.Provider value={value}>
      {children}
    </MapExplorerContext.Provider>
  );
};
