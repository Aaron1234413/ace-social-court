
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapContainerProps {
  className?: string;
  height?: string;
}

const MapContainer = ({ className, height = 'h-[70vh]' }: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Fetch Mapbox token from Supabase
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        // We need to use raw query here since app_settings isn't in the TypeScript types yet
        const { data, error } = await supabase.rpc('get_setting', { setting_key: 'mapbox_token' });
        
        if (error) {
          console.error('Error fetching Mapbox token:', error);
          setShowTokenInput(true);
          setLoading(false);
          return;
        }
        
        if (data) {
          setMapboxToken(data);
        } else {
          setShowTokenInput(true);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        setShowTokenInput(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
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
    }
  }, [mapboxToken]);

  const saveMapboxToken = async () => {
    if (!tokenInput.trim()) return;
    
    try {
      setLoading(true);
      
      // First save to local state to initialize the map
      setMapboxToken(tokenInput);
      
      // Then save to Supabase for persistence using raw query
      const { error } = await supabase.rpc(
        'set_setting',
        { setting_key: 'mapbox_token', setting_value: tokenInput }
      );
      
      if (error) throw error;
      
      setShowTokenInput(false);
      toast.success("Mapbox token saved successfully");
    } catch (error) {
      console.error('Error saving Mapbox token:', error);
      toast.error("There was an error saving your Mapbox token");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`${className || ''} ${height} flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (showTokenInput) {
    return (
      <Card className={`${className || ''} ${height} p-6 flex flex-col items-center justify-center`}>
        <h3 className="text-lg font-semibold mb-4">Mapbox API Token Required</h3>
        <p className="text-muted-foreground mb-6 text-center">
          To use the map features, please enter your Mapbox public token. 
          You can get one for free from <a href="https://mapbox.com/account/access-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mapbox</a>.
        </p>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter Mapbox public token"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button type="button" onClick={saveMapboxToken} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
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
