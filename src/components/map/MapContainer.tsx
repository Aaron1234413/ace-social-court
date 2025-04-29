
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hardcoded Ace Social Mapbox token
const ACE_SOCIAL_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWNlc29jaWFsIiwiYSI6ImNscGsxY3pzZjIzb2gya3A1cnhwM2Rnb2UifQ.NuO33X9W3CNpUyTKT7_X2Q';

interface MapContainerProps {
  className?: string;
  height?: string;
}

const MapContainer = ({ className, height = 'h-[70vh]' }: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    try {
      // Use the Ace Social Mapbox token
      mapboxgl.accessToken = ACE_SOCIAL_MAPBOX_TOKEN;
      
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

      setLoading(false);

      // Clean up on unmount
      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      toast.error("There was an error initializing the map");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Card className={`${className || ''} ${height} flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
