
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// User-provided Mapbox token (primary)
const USER_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWFyb24yMWNhbXBvcyIsImEiOiJjbWEydXkyZXExNW5rMmpxNmh5eGs5NmgyIn0.GyTAYck1VjlY0OWF8e6Y7w';
// Fallback Ace Social Mapbox token
const ACE_SOCIAL_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWNlc29jaWFsIiwiYSI6ImNscGsxY3pzZjIzb2gya3A1cnhwM2Rnb2UifQ.NuO33X9W3CNpUyTKT7_X2Q';

interface MapContainerProps {
  className?: string;
  height?: string;
}

const MapContainer = ({ className, height = 'h-[70vh]' }: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Function to initialize map with given token
  const initializeMap = (token: string) => {
    if (!mapContainer.current) {
      console.error("Map container not found");
      return false;
    }

    if (map.current) {
      // If we already have a map instance, remove it first
      map.current.remove();
      map.current = null;
    }
    
    try {
      console.log("Initializing map with token:", token.substring(0, 10) + '...');
      mapboxgl.accessToken = token;
      
      // Create map instance
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 30], // Default center
        zoom: 2,
        failIfMajorPerformanceCaveat: false // More forgiving performance requirements
      });

      // Set a timeout to detect if map is taking too long to load
      const timeoutId = setTimeout(() => {
        if (loading && !mapError) {
          console.warn("Map load timeout - possible token issue");
          setMapError("Map is taking too long to load");
        }
      }, 10000);

      // Add navigation controls (zoom in/out)
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Listen for map load event to confirm success
      map.current.on('load', () => {
        console.log("Map loaded successfully");
        setLoading(false);
        setMapError(null);
        clearTimeout(timeoutId);
        
        // Add geolocate control after map has loaded
        try {
          map.current?.addControl(
            new mapboxgl.GeolocateControl({
              positionOptions: {
                enableHighAccuracy: true
              },
              trackUserLocation: true,
              showUserHeading: true
            }),
            'top-right'
          );
        } catch (error) {
          console.warn("Could not add geolocation control:", error);
        }
        
        toast.success("Map loaded successfully");
      });

      // Listen for error events
      map.current.on('error', (e) => {
        console.error("Map error:", e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
        setLoading(false);
        clearTimeout(timeoutId);
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

  // Initialize map on component mount
  useEffect(() => {
    console.log("MapContainer mounted, initializing map...");
    
    // Try with user token first
    const userTokenSuccess = initializeMap(USER_MAPBOX_TOKEN);
    
    // If user token fails, try fallback after a short delay
    if (!userTokenSuccess) {
      console.log("User token failed, will try fallback token");
      const fallbackTimer = setTimeout(() => {
        console.log("Trying fallback token now");
        initializeMap(ACE_SOCIAL_MAPBOX_TOKEN);
      }, 2000);
      
      return () => {
        clearTimeout(fallbackTimer);
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    }

    // Clean up on unmount
    return () => {
      console.log("MapContainer unmounting, cleaning up map instance");
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <Card className={`${className || ''} ${height} flex flex-col items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </Card>
    );
  }

  if (mapError) {
    return (
      <Card className={`${className || ''} ${height} flex flex-col items-center justify-center p-4`}>
        <p className="text-red-500 mb-4">{mapError}</p>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => {
              setLoading(true);
              setMapError(null);
              initializeMap(USER_MAPBOX_TOKEN);
            }}
          >
            Try with your token
          </button>
          <button 
            className="px-4 py-2 bg-secondary text-foreground rounded-md"
            onClick={() => {
              setLoading(true);
              setMapError(null);
              initializeMap(ACE_SOCIAL_MAPBOX_TOKEN);
            }}
          >
            Try with fallback token
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className || ''} ${height} relative overflow-hidden`}>
      <div ref={mapContainer} className="absolute inset-0" />
    </Card>
  );
};

export default MapContainer;
