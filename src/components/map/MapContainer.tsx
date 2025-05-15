import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2, RefreshCw, Locate, AlertTriangle, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// User-provided Mapbox token (primary)
const USER_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWFyb24yMWNhbXBvcyIsImEiOiJjbWEydXkyZXExNW5rMmpxNmh5eGs5NmgyIn0.GyTAYck1VjlY0OWF8e6Y7w';
// Fallback Ace Social Mapbox token
const ACE_SOCIAL_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWNlc29jaWFsIiwiYSI6ImNscGsxY3pzZjIzb2gya3A1cnhwM2Rnb2UifQ.NuO33X9W3CNpUyTKT7_X2Q';

interface LocationPrivacySettings {
  shareExactLocation: boolean;
  showOnMap: boolean;
  locationHistory: boolean;
}

interface MapContainerProps {
  className?: string;
  height?: string;
  locationPrivacySettings?: LocationPrivacySettings;
  children?: React.ReactNode;
  onMapInitialized?: (map: mapboxgl.Map) => void;
  onUserPositionUpdate?: (position: {lng: number, lat: number}) => void;
}

const defaultPrivacySettings: LocationPrivacySettings = {
  shareExactLocation: false,
  showOnMap: false,
  locationHistory: false
};

const MapContainer = ({ 
  className, 
  height = 'h-[70vh]',
  locationPrivacySettings = defaultPrivacySettings,
  children,
  onMapInitialized,
  onUserPositionUpdate
}: MapContainerProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const mapInitializedRef = useRef(false);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [userPosition, setUserPosition] = useState<{lng: number, lat: number} | null>(null);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  const initializeMap = (token: string) => {
    if (!mapContainerRef.current) {
      console.error("Map container element not found");
      setMapError("Map container not available");
      setLoading(false);
      return false;
    }

    try {
      console.log("Starting map initialization with token:", token.substring(0, 10) + '...');
      console.log("Map container dimensions:", 
                 mapContainerRef.current.offsetWidth, 
                 mapContainerRef.current.offsetHeight);
                 
      mapboxgl.accessToken = token;
      
      // Clean up existing map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      // Create new map instance without the explicit width/height properties
      // as they're not part of the MapOptions type
      mapInstanceRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-98.5795, 39.8283], // Center of the US
        zoom: 3,
        attributionControl: true,
        preserveDrawingBuffer: true // Allows for image export
      });

      // Listen for map load event to confirm success
      mapInstanceRef.current.on('load', () => {
        console.log("Map loaded successfully");
        console.log("Map container visible after load:", 
                   mapContainerRef.current?.offsetWidth, 
                   mapContainerRef.current?.offsetHeight);
        
        setLoading(false);
        setMapError(null);
        mapInitializedRef.current = true;
        
        // Add navigation controls (zoom in/out)
        mapInstanceRef.current?.addControl(
          new mapboxgl.NavigationControl(),
          'top-right'
        );
        
        // Add geolocation control after map has loaded
        try {
          geolocateControlRef.current = new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: locationPrivacySettings.shareExactLocation,
              timeout: 6000
            },
            trackUserLocation: locationPrivacySettings.locationHistory,
            showUserHeading: locationPrivacySettings.shareExactLocation,
            showUserLocation: false // We'll handle displaying user location ourselves
          });
          
          mapInstanceRef.current?.addControl(
            geolocateControlRef.current,
            'top-right'
          );
          
          // Listen to position changes if user has enabled location sharing
          if (locationPrivacySettings.showOnMap) {
            setupLocationTracking();
          }
        } catch (error) {
          console.warn("Could not add geolocation control:", error);
        }
        
        // Force a resize to ensure the map renders properly
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.resize();
            console.log("Forced map resize");
          }
        }, 300);
        
        // Callback to parent component when map is initialized
        if (onMapInitialized && mapInstanceRef.current) {
          onMapInitialized(mapInstanceRef.current);
        }
        
        toast.success("Map loaded successfully");
      });

      // Listen for error events
      mapInstanceRef.current.on('error', (e) => {
        console.error("Map error:", e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
        setLoading(false);
        return false;
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
      return false;
    }
  };

  const setupLocationTracking = () => {
    if (!mapInstanceRef.current || !geolocateControlRef.current) return;
    
    // Listen for geolocate events to update our user position
    const geolocateControl = geolocateControlRef.current;
    
    // Fix: Type the geolocate event properly
    mapInstanceRef.current.on('geolocate', (e: any) => {
      // This event provides the user's location
      if (e && e.coords) {
        const { longitude, latitude } = e.coords;
        
        // Store user position
        const newPosition = { lng: longitude, lat: latitude };
        setUserPosition(newPosition);
        
        // Notify parent component of position update
        if (onUserPositionUpdate) {
          onUserPositionUpdate(newPosition);
        }
        
        // If user wants to show location on map, add or update marker
        if (locationPrivacySettings.showOnMap) {
          updateUserMarker(longitude, latitude);
        }
        
        console.log("User location:", longitude, latitude);
        setLocationWarning(null);
      }
    });
    
    // Fix: Type the error event properly
    geolocateControl.on('error', (e: any) => {
      console.error("Geolocation error:", e);
      
      // Extract error message safely
      let errorMessage = "Could not determine your location";
      
      // Check if error is a GeolocationPositionError (from browser API)
      if (e && 'message' in e) {
        errorMessage = e.message || errorMessage;
      } else if (e && 'code' in e) {
        // Handle standard Geolocation API errors by code
        const code = e.code;
        if (code === 1) {
          errorMessage = "Location access denied";
        } else if (code === 2) {
          errorMessage = "Location unavailable";
        } else if (code === 3) {
          errorMessage = "Location request timed out";
        }
      }
      
      setLocationWarning(errorMessage);
      
      if (userMarkerRef.current && !locationPrivacySettings.showOnMap) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    });
  };
  
  const updateUserMarker = (longitude: number, latitude: number) => {
    if (!mapInstanceRef.current) return;
    
    // If we should show user on map
    if (locationPrivacySettings.showOnMap) {
      // Remove existing marker if precision changed
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      
      if (locationPrivacySettings.shareExactLocation) {
        // Precise location marker (blue dot)
        el.innerHTML = `
          <div class="relative">
            <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
            <div class="absolute -inset-1 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
          </div>
        `;
      } else {
        // Approximate location marker (larger blue circle)
        el.innerHTML = `
          <div class="w-8 h-8 bg-blue-500 rounded-full opacity-30"></div>
        `;
      }
      
      // Create the marker
      userMarkerRef.current = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([longitude, latitude])
        .addTo(mapInstanceRef.current);
    } else if (userMarkerRef.current) {
      // Remove marker if user disabled showing location
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  };

  const findUserLocation = () => {
    if (!mapInstanceRef.current || !geolocateControlRef.current) {
      toast.error("Map is not ready yet");
      return;
    }
    
    try {
      // Trigger the geolocate control
      geolocateControlRef.current.trigger();
      toast.success("Finding your location...");
    } catch (error) {
      console.error("Error finding location:", error);
      toast.error("Could not access your location");
    }
  };
  
  useEffect(() => {
    if (mapInstanceRef.current && userPosition) {
      if (locationPrivacySettings.showOnMap) {
        updateUserMarker(userPosition.lng, userPosition.lat);
      } else if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    }
    
    // Update geolocate control settings if it exists
    if (geolocateControlRef.current && mapInstanceRef.current) {
      // We need to remove and re-add the control to update its settings
      mapInstanceRef.current.removeControl(geolocateControlRef.current);
      
      geolocateControlRef.current = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: locationPrivacySettings.shareExactLocation,
          timeout: 6000
        },
        trackUserLocation: locationPrivacySettings.locationHistory,
        showUserHeading: locationPrivacySettings.shareExactLocation,
        showUserLocation: false // We'll handle displaying user location ourselves
      });
      
      mapInstanceRef.current.addControl(
        geolocateControlRef.current,
        'top-right'
      );
      
      if (locationPrivacySettings.showOnMap) {
        setupLocationTracking();
      }
    }
  }, [locationPrivacySettings, onUserPositionUpdate]);

  useEffect(() => {
    // Ensure component is fully mounted and container exists in DOM
    const timer = setTimeout(() => {
      console.log("Attempting map initialization...");
      console.log("Map container exists:", !!mapContainerRef.current);
      
      if (mapContainerRef.current) {
        console.log("Container dimensions:", 
                   mapContainerRef.current.offsetWidth, 
                   mapContainerRef.current.offsetHeight,
                   "Style:", window.getComputedStyle(mapContainerRef.current).display);
      }
      
      if (!mapInitializedRef.current) {
        // Try user token first
        const userTokenSuccess = initializeMap(USER_MAPBOX_TOKEN);
        
        // If user token fails, try fallback
        if (!userTokenSuccess) {
          console.log("User token failed, trying fallback token");
          setTimeout(() => {
            if (!mapInitializedRef.current) {
              initializeMap(ACE_SOCIAL_MAPBOX_TOKEN);
            }
          }, 500);
        }
      }
    }, 100); // Short delay to ensure DOM is ready
    
    // Add window resize handler to make the map responsive
    const handleResize = () => {
      if (mapInstanceRef.current) {
        console.log("Window resized, resizing map");
        mapInstanceRef.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        console.log("Cleaning up map instance");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleRetry = () => {
    console.log("Retrying map initialization");
    setLoading(true);
    setMapError(null);
    mapInitializedRef.current = false;
    
    // Try user token first
    const userTokenSuccess = initializeMap(USER_MAPBOX_TOKEN);
    
    // If user token fails, try fallback
    if (!userTokenSuccess) {
      setTimeout(() => {
        if (!mapInitializedRef.current) {
          initializeMap(ACE_SOCIAL_MAPBOX_TOKEN);
        }
      }, 500);
    }
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log("Debug mode:", !debugMode);
    
    // Log map container state
    if (mapContainerRef.current) {
      console.log("Map container:", mapContainerRef.current);
      console.log("Map container dimensions:", 
                 mapContainerRef.current.offsetWidth, 
                 mapContainerRef.current.offsetHeight);
      console.log("Map container style:", 
                 window.getComputedStyle(mapContainerRef.current));
    }
    
    // Log map instance state
    console.log("Map instance:", mapInstanceRef.current);
    
    if (mapInstanceRef.current) {
      // Force resize
      mapInstanceRef.current.resize();
      console.log("Forced map resize");
    }
  };

  return (
    <Card className={`${className || ''} ${height} relative overflow-hidden`}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      )}
      
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10 p-4">
          <p className="text-red-500 mb-4 text-center">{mapError}</p>
          <Button 
            onClick={handleRetry}
            className="flex items-center gap-2 mb-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Loading Map
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            Note: Make sure you have allowed location access in your browser
          </p>
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0" 
        id="map-container" 
        style={{
          width: '100%',
          height: '100%',
          background: '#e5e7eb' // Light gray background to make container visible
        }}
      />
      
      {/* Render children (map layers, markers, etc.) */}
      {!loading && !mapError && children}
      
      {!loading && !mapError && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col space-y-2">
          <Button 
            onClick={findUserLocation}
            variant="default"
            className="flex items-center gap-2 shadow-lg"
          >
            <Locate className="h-4 w-4" />
            Find my location
          </Button>
          
          <Button
            onClick={toggleDebugMode}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-white/80"
          >
            <Bug className="h-3 w-3" />
            {debugMode ? 'Hide Debug Info' : 'Debug Map'}
          </Button>
          
          {locationWarning && (
            <div className="mt-2 bg-amber-50 border border-amber-200 p-2 rounded-md text-xs text-amber-800 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>{locationWarning}</span>
            </div>
          )}
        </div>
      )}
      
      {debugMode && (
        <div className="absolute top-4 right-4 z-10 bg-white/90 p-2 rounded shadow-md text-xs">
          <h4 className="font-bold">Map Debug Info</h4>
          <p>Map loaded: {mapInitializedRef.current ? 'Yes' : 'No'}</p>
          <p>Container: {mapContainerRef.current ? 'Exists' : 'Missing'}</p>
          {mapContainerRef.current && (
            <>
              <p>Width: {mapContainerRef.current.offsetWidth}px</p>
              <p>Height: {mapContainerRef.current.offsetHeight}px</p>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default MapContainer;
