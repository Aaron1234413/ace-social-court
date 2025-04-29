
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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const mapInitializedRef = useRef(false);

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
    </Card>
  );
};

export default MapContainer;
