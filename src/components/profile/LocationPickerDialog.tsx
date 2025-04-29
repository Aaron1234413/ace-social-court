
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Alert, AlertDescription } from '@/components/ui/alert';

// User-provided Mapbox token (primary)
const USER_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWFyb24yMWNhbXBvcyIsImEiOiJjbWEydXkyZXExNW5rMmpxNmh5eGs5NmgyIn0.GyTAYck1VjlY0OWF8e6Y7w';
// Fallback Ace Social Mapbox token
const ACE_SOCIAL_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWNlc29jaWFsIiwiYSI6ImNscGsxY3pzZjIzb2gya3A1cnhwM2Rnb2UifQ.NuO33X9W3CNpUyTKT7_X2Q';

interface LocationPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address: string) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

const LocationPickerDialog: React.FC<LocationPickerDialogProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLatitude,
  initialLongitude
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Set Mapbox token before initializing
  const setMapboxToken = () => {
    try {
      // Try primary token first
      mapboxgl.accessToken = USER_MAPBOX_TOKEN;
      return true;
    } catch (error) {
      console.error('Error setting primary Mapbox token:', error);
      try {
        // Fall back to secondary token if primary fails
        mapboxgl.accessToken = ACE_SOCIAL_MAPBOX_TOKEN;
        return true;
      } catch (fallbackError) {
        console.error('Error setting fallback Mapbox token:', fallbackError);
        setMapError('Could not initialize map. Please try again later.');
        return false;
      }
    }
  };

  // Initialize map when dialog opens
  useEffect(() => {
    if (!isOpen || !mapContainer.current || mapInitialized) return;

    const initMap = async () => {
      setLoading(true);
      setMapError(null);

      // Set the Mapbox token first
      if (!setMapboxToken()) {
        setLoading(false);
        return;
      }

      try {
        // Create map instance
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: initialLatitude && initialLongitude ? 
            [initialLongitude, initialLatitude] : 
            [-98.5795, 39.8283], // Default to US center
          zoom: initialLatitude && initialLongitude ? 13 : 3
        });

        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl(),
          'top-right'
        );

        // Create a marker if initial position provided
        if (initialLatitude && initialLongitude) {
          marker.current = new mapboxgl.Marker({ color: '#3b82f6', draggable: true })
            .setLngLat([initialLongitude, initialLatitude])
            .addTo(map.current);

          // Get address for initial position
          const address = await reverseGeocode(initialLatitude, initialLongitude);
          setSelectedPosition({
            lat: initialLatitude,
            lng: initialLongitude,
            address
          });
          
          // Set up drag end event for marker
          marker.current.on('dragend', handleMarkerDragEnd);
        }

        // Handle map click to set marker
        map.current.on('click', handleMapClick);

        map.current.on('load', () => {
          setLoading(false);
          setMapInitialized(true);
        });

        // Handle map error events
        map.current.on('error', (e) => {
          console.error('Map error:', e);
          setMapError('Map error occurred. Please try again.');
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please try again later.');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapInitialized(false);
      }
      if (marker.current) {
        marker.current = null;
      }
    };
  }, [isOpen, initialLatitude, initialLongitude, mapInitialized]);

  // Handle map click to place marker
  const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
    if (!map.current) return;
    
    const { lng, lat } = e.lngLat;
    
    // Remove existing marker if any
    if (marker.current) {
      marker.current.remove();
    }
    
    // Create new marker at clicked position
    marker.current = new mapboxgl.Marker({ color: '#3b82f6', draggable: true })
      .setLngLat([lng, lat])
      .addTo(map.current);
    
    // Set up drag end event for marker
    marker.current.on('dragend', handleMarkerDragEnd);
    
    try {
      // Get address for the location
      const address = await reverseGeocode(lat, lng);
      setSelectedPosition({ lat, lng, address });
    } catch (error) {
      console.error('Error getting address:', error);
      // Even if we fail to get the address, set the position with coordinates
      setSelectedPosition({
        lat, 
        lng, 
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    }
  };

  // Handle marker drag end
  const handleMarkerDragEnd = async () => {
    if (!marker.current) return;
    
    const position = marker.current.getLngLat();
    try {
      const address = await reverseGeocode(position.lat, position.lng);
      setSelectedPosition({
        lat: position.lat,
        lng: position.lng,
        address
      });
    } catch (error) {
      console.error('Error getting address after drag:', error);
      setSelectedPosition({
        lat: position.lat,
        lng: position.lng,
        address: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
      });
    }
  };

  // Search for locations using Mapbox Geocoding API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    
    try {
      // Make sure we have a token set before searching
      if (!mapboxgl.accessToken) {
        setMapboxToken();
      }
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
      } else {
        setSearchError('No locations found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchError('Location search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Select a location from search results
  const selectSearchResult = async (result: any) => {
    if (!map.current) return;
    
    const [lng, lat] = result.center;
    
    // Fly to the selected location
    map.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      essential: true
    });
    
    // Remove existing marker if any
    if (marker.current) {
      marker.current.remove();
    }
    
    // Create new marker at the selected location
    marker.current = new mapboxgl.Marker({ color: '#3b82f6', draggable: true })
      .setLngLat([lng, lat])
      .addTo(map.current);
    
    // Set up drag end event for marker
    marker.current.on('dragend', handleMarkerDragEnd);
    
    // Set selected position
    setSelectedPosition({
      lat,
      lng,
      address: result.place_name
    });
    
    // Clear search results
    setSearchResults([]);
    setSearchQuery('');
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      if (!mapboxgl.accessToken) {
        setMapboxToken();
      }
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.features && data.features.length > 0 
        ? data.features[0].place_name 
        : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (selectedPosition) {
      onSelectLocation(
        selectedPosition.lat, 
        selectedPosition.lng, 
        selectedPosition.address
      );
      onClose();
    }
  };

  // Handle key press for search input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Set Your Location</DialogTitle>
          <DialogDescription>
            Search for a location or click on the map to set your position
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for a location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
              type="button"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {searchResults.length > 0 && (
            <div className="bg-background border rounded-md max-h-[200px] overflow-y-auto">
              <ul>
                {searchResults.map((result) => (
                  <li 
                    key={result.id}
                    className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                    onClick={() => selectSearchResult(result)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectSearchResult(result);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{result.place_name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div 
            ref={mapContainer} 
            className="h-[300px] w-full rounded-md border relative"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center p-4">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive">{mapError}</p>
                </div>
              </div>
            )}
          </div>

          {selectedPosition && (
            <div className="bg-muted p-3 rounded-md">
              <Label className="text-xs text-muted-foreground">Selected Location</Label>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm">{selectedPosition.address}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedPosition}
            type="button"
          >
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerDialog;
