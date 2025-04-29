
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Primary Ace Social Mapbox token
const ACE_SOCIAL_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWNlc29jaWFsIiwiYSI6ImNscGsxY3pzZjIzb2gya3A1cnhwM2Rnb2UifQ.NuO33X9W3CNpUyTKT7_X2Q';
// Fallback token in case the primary one has issues
const FALLBACK_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWFyb24yMWNhbXBvcyIsImEiOiJjbWEydXkyZXExNW5rMmpxNmh5eGs5NmgyIn0.GyTAYck1VjlY0OWF8e6Y7w';

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
    if (!mapContainer.current || map.current) return;
    
    try {
      console.log("Initializing map with token:", token);
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 30], // Default center
        zoom: 2
      });

      // Add navigation controls (zoom in/out)
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      // Listen for map load event to confirm success
      map.current.on('load', () => {
        console.log("Map loaded successfully");
        setLoading(false);
        setMapError(null);
      });

      // Listen for error events
      map.current.on('error', (e) => {
        console.error("Map error:", e);
        setMapError("Error loading map");
        setLoading(false);
      });
      
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setMapError("Failed to initialize map");
      setLoading(false);
      return false;
    }
    return true;
  };

  // Initialize map on component mount
  useEffect(() => {
    // Try with primary token first
    const primarySuccess = initializeMap(ACE_SOCIAL_MAPBOX_TOKEN);
    
    // If primary token fails, try fallback after a short delay
    if (!primarySuccess) {
      const fallbackTimer = setTimeout(() => {
        console.log("Trying fallback token");
        initializeMap(FALLBACK_MAPBOX_TOKEN);
      }, 1000);
      
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
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <Card className={`${className || ''} ${height} flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (mapError) {
    return (
      <Card className={`${className || ''} ${height} flex flex-col items-center justify-center p-4`}>
        <p className="text-red-500 mb-2">{mapError}</p>
        <button 
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => {
            setLoading(true);
            setMapError(null);
            // Try the fallback token
            initializeMap(FALLBACK_MAPBOX_TOKEN);
          }}
        >
          Retry
        </button>
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
