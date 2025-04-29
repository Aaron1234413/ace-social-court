
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2, RefreshCw, Locate, AlertTriangle } from 'lucide-react';
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
}

const defaultPrivacySettings: LocationPrivacySettings = {
  shareExactLocation: false,
  showOnMap: false,
  locationHistory: false
};

const MapContainer = ({ 
  className, 
  height = 'h-[70vh]',
  locationPrivacySettings = defaultPrivacySettings
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

  const initializeMap = (token: string) => {
    if (!mapContainerRef.current) {
      console.error("Map container element not found");
      setMapError("Map container not available");
      setLoading(false);
      return false;
    }

    try {
      console.log("Starting map initialization with token:", token.substring(0, 10) + '...');
      mapboxgl.accessToken = token;
      
      // Clean up existing map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      // Create new map instance
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
    
    mapInstanceRef.current.on('geolocate', (e) => {
      // This event provides the user's location
      const { longitude, latitude } = e.coords;
      
      // Store user position
      setUserPosition({
        lng: longitude,
        lat: latitude
      });
      
      // If user wants to show location on map, add or update marker
      if (locationPrivacySettings.showOnMap) {
        updateUserMarker(longitude, latitude);
      }
      
      console.log("User location:", longitude, latitude);
      setLocationWarning(null);
    });
    
    // Handle errors in geolocation
    geolocateControl.on('error', (e) => {
      console.error("Geolocation error:", e.error);
      setLocationWarning(e.error?.message || "Could not determine your location");
      
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
  
  // Clean up user marker when privacy settings change
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
  }, [locationPrivacySettings]);

  useEffect(() => {
    // Ensure component is fully mounted and container exists in DOM
    const timer = setTimeout(() => {
      console.log("Attempting map initialization...");
      console.log("Map container exists:", !!mapContainerRef.current);
      
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
    
    return () => {
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
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Loading Map
          </Button>
        </div>
      )}
      
      <div ref={mapContainerRef} className="absolute inset-0" id="map-container" />
      
      {!loading && !mapError && (
        <div className="absolute bottom-4 left-4 z-10">
          <Button 
            onClick={findUserLocation}
            variant="default"
            className="flex items-center gap-2 shadow-lg"
          >
            <Locate className="h-4 w-4" />
            Find my location
          </Button>
          
          {locationWarning && (
            <div className="mt-2 bg-amber-50 border border-amber-200 p-2 rounded-md text-xs text-amber-800 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>{locationWarning}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default MapContainer;
