
import React, { useState, useEffect } from 'react';
import MapContainer from '@/components/map/MapContainer';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Users, 
  UserCog,
  Calendar,
  SlidersHorizontal,
  Loader2,
  MapPinCheck,
  Lock,
  Shield
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import LocationPrivacyControl from '@/components/map/LocationPrivacyControl';
import NearbyUsersList from '@/components/map/NearbyUsersList';
import NearbyUsersLayer from '@/components/map/NearbyUsersLayer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';

// Mock data for nearby users until we have a real API implementation
const MOCK_NEARBY_USERS = [
  {
    id: '1',
    full_name: 'Sarah Williams',
    username: 'sarahtennis',
    avatar_url: null,
    user_type: 'player',
    distance: 0.8,
    latitude: 40.7128,
    longitude: -74.006
  },
  {
    id: '2',
    full_name: 'Coach Mike',
    username: 'tennispro',
    avatar_url: null,
    user_type: 'coach',
    distance: 1.2,
    latitude: 40.7138,
    longitude: -74.008
  },
  {
    id: '3',
    full_name: 'Alex Johnson',
    username: 'alexj',
    avatar_url: null,
    user_type: 'player',
    distance: 1.5,
    latitude: 40.7118,
    longitude: -74.004
  }
];

const MapExplorer = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    showCourts: true,
    showPlayers: true,
    showCoaches: true,
    showEvents: true,
    distance: 25, // in miles
  });
  
  const [isReady, setIsReady] = useState(false);
  const [userLocationEnabled, setUserLocationEnabled] = useState(false);
  const [locationPrivacy, setLocationPrivacy] = useState({
    shareExactLocation: false,
    showOnMap: false,
    locationHistory: false,
  });
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [userPosition, setUserPosition] = useState<{lng: number, lat: number} | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Query for nearby users - using mock data for now
  // In a real implementation, this would fetch from Supabase based on the user's location
  const { data: nearbyUsers, isLoading: isLoadingNearbyUsers } = useQuery({
    queryKey: ['nearby-users', userPosition, filters.distance],
    queryFn: async () => {
      // Mock implementation - in reality, would fetch from database
      if (!userPosition) return [];
      
      // In a real implementation, you'd use a Supabase function or query to find users within distance
      // For now, return mock data
      return MOCK_NEARBY_USERS;
    },
    enabled: !!userPosition,
  });
  
  useEffect(() => {
    // Ensure the component is fully mounted
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // Show toast for filter changes
    toast.info(`${key.replace('show', '')} ${filters[key] ? 'hidden' : 'shown'}`);
  };

  const setDistance = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      distance: value[0]
    }));
  };

  const togglePrivacySetting = (key: keyof typeof locationPrivacy) => {
    setLocationPrivacy(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };
      
      // If they disable showing on map, also disable exact location sharing
      if (key === 'showOnMap' && !newSettings.showOnMap) {
        newSettings.shareExactLocation = false;
      }
      
      // If they enable exact location, also enable showing on map
      if (key === 'shareExactLocation' && newSettings.shareExactLocation) {
        newSettings.showOnMap = true;
      }
      
      // Show toast for changes
      toast.info(`Location ${key} ${newSettings[key] ? 'enabled' : 'disabled'}`);
      
      return newSettings;
    });
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

  const handleUserPositionUpdate = (position: {lng: number, lat: number}) => {
    setUserPosition(position);
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
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Map Filters</SheetTitle>
              <SheetDescription>
                Control what you see on the tennis map.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Location Types</h3>
                <div className="flex flex-wrap gap-2">
                  <Toggle 
                    pressed={filters.showCourts} 
                    onPressedChange={() => toggleFilter('showCourts')}
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4" /> Courts
                  </Toggle>
                  <Toggle 
                    pressed={filters.showPlayers} 
                    onPressedChange={() => toggleFilter('showPlayers')}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" /> Players
                  </Toggle>
                  <Toggle 
                    pressed={filters.showCoaches} 
                    onPressedChange={() => toggleFilter('showCoaches')}
                    className="gap-2"
                  >
                    <UserCog className="h-4 w-4" /> Coaches
                  </Toggle>
                  <Toggle 
                    pressed={filters.showEvents} 
                    onPressedChange={() => toggleFilter('showEvents')}
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" /> Events
                  </Toggle>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Distance</h3>
                  <div className="px-2">
                    <Slider 
                      defaultValue={[filters.distance]} 
                      max={100} 
                      step={5} 
                      onValueChange={setDistance}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>0 mi</span>
                      <span>{filters.distance} mi</span>
                      <span>100 mi</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Location Settings</h3>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    {userLocationEnabled 
                      ? "Location access is enabled" 
                      : "Enable location access for better results"}
                  </p>
                  
                  {userLocationEnabled ? (
                    <LocationPrivacyControl 
                      settings={locationPrivacy} 
                      onChange={togglePrivacySetting} 
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <Shield className="h-4 w-4" />
                      <span>Location services are disabled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {isReady ? (
            <MapContainer 
              className="rounded-lg shadow-md" 
              height="h-[70vh]" 
              locationPrivacySettings={locationPrivacy}
              onMapInitialized={setMapInstance}
              onUserPositionUpdate={handleUserPositionUpdate}
            >
              {mapInstance && nearbyUsers && (
                <NearbyUsersLayer 
                  users={nearbyUsers} 
                  map={mapInstance}
                  filters={{
                    showPlayers: filters.showPlayers,
                    showCoaches: filters.showCoaches
                  }}
                  onSelectUser={handleUserSelect}
                />
              )}
            </MapContainer>
          ) : (
            <div className="rounded-lg shadow-md h-[70vh] flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <NearbyUsersList 
            users={nearbyUsers || []}
            isLoading={isLoadingNearbyUsers || !userPosition}
            onUserSelect={handleUserSelect}
          />
          
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Your Location Status</h3>
            {userLocationEnabled && locationPrivacy.showOnMap ? (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <MapPinCheck className="h-4 w-4" />
                  <span>
                    Your {locationPrivacy.shareExactLocation ? 'exact' : 'approximate'} location is visible to other tennis players
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Shield className="h-4 w-4" />
                  <span>Your location is private and not visible to others</span>
                </div>
              </div>
            )}
            
            {!userPosition && userLocationEnabled && (
              <Button
                className="mt-3 w-full"
                size="sm"
                onClick={() => {
                  toast.info("Finding your location...");
                }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Share my location
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapExplorer;
