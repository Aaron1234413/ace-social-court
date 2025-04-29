
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// User-provided Mapbox token (primary)
const USER_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWFyb24yMWNhbXBvcyIsImEiOiJjbWEydXkyZXExNW5rMmpxNmh5eGs5NmgyIn0.GyTAYck1VjlY0OWF8e6Y7w';
// Fallback Ace Social Mapbox token
const ACE_SOCIAL_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWNlc29jaWFsIiwiYSI6ImNscGsxY3pzZjIzb2gya3A1cnhwM2Rnb2UifQ.NuO33X9W3CNpUyTKT7_X2Q';

interface MapContainerProps {
  className?: string;
  height?: string;
}

const MapContainer = ({ className, height = 'h-[70vh]' }: MapContainerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [mounted, setMounted] = useState(false);

  // Function to initialize map with given token
  const initializeMap = (token: string) => {
    if (!mapContainerRef.current) {
      console.log("Map container ref is null, cannot initialize map");
      return false;
    }

    try {
      console.log("Initializing map with token:", token.substring(0, 10) + '...');
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
        center: [-74.5, 40], // Default to US East Coast
        zoom: 4,
        failIfMajorPerformanceCaveat: false // More forgiving performance requirements
      });

      // Set a timeout to detect if map is taking too long to load
      const timeoutId = setTimeout(() => {
        if (loading && !mapError) {
          console.warn("Map load timeout - possible token issue");
          setMapError("Map is taking too long to load");
          setLoading(false);
        }
      }, 10000);

      // Add navigation controls (zoom in/out)
      mapInstanceRef.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Listen for map load event to confirm success
      mapInstanceRef.current.on('load', () => {
        console.log("Map loaded successfully");
        setLoading(false);
        setMapError(null);
        clearTimeout(timeoutId);
        
        // Add geolocate control after map has loaded
        try {
          mapInstanceRef.current?.addControl(
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
      mapInstanceRef.current.on('error', (e) => {
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

  // Initialize map after component has mounted
  useEffect(() => {
    setMounted(true);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize map once component is mounted and ref is available
  useEffect(() => {
    if (!mounted) return;
    
    console.log("Component mounted, attempting to initialize map");
    console.log("Map container exists:", !!mapContainerRef.current);
    
    // Short delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      // Try with user token first
      const userTokenSuccess = initializeMap(USER_MAPBOX_TOKEN);
      
      // If user token fails, try fallback after a short delay
      if (!userTokenSuccess) {
        console.log("User token failed, will try fallback token");
        const fallbackTimer = setTimeout(() => {
          console.log("Trying fallback token now");
          initializeMap(ACE_SOCIAL_MAPBOX_TOKEN);
        }, 1000);
        
        return () => clearTimeout(fallbackTimer);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [mounted]);

  const handleRetry = () => {
    setLoading(true);
    setMapError(null);
    // Try user token first, then fallback
    const success = initializeMap(USER_MAPBOX_TOKEN);
    if (!success) {
      setTimeout(() => initializeMap(ACE_SOCIAL_MAPBOX_TOKEN), 1000);
    }
  };

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
        <Button 
          onClick={handleRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Loading Map
        </Button>
      </Card>
    );
  }

  return (
    <Card className={`${className || ''} ${height} relative overflow-hidden`}>
      <div ref={mapContainerRef} className="absolute inset-0" />
    </Card>
  );
};

export default MapContainer;
