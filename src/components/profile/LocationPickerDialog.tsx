
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(initialLatitude && initialLongitude ? {
    lat: initialLatitude,
    lng: initialLongitude,
    address: ''
  } : null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [confirmButtonClicked, setConfirmButtonClicked] = useState(false);
  
  // Search for locations using Mapbox Geocoding API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    console.log('Searching for:', searchQuery);
    
    try {
      const mapboxToken = USER_MAPBOX_TOKEN || ACE_SOCIAL_MAPBOX_TOKEN;
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        console.log('Search results:', data.features);
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
  const selectSearchResult = (result: any) => {
    console.log('Search result selected:', result);
    const [lng, lat] = result.center;
    
    // Set selected position
    setSelectedPosition({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: result.place_name
    });
    setConfirmButtonClicked(false);
    
    toast.success('Location selected!');
    console.log('Selected position:', {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: result.place_name
    });
    
    // Clear search results
    setSearchResults([]);
  };

  // Handle form submission
  const handleSubmit = () => {
    setConfirmButtonClicked(true);
    
    if (selectedPosition) {
      console.log('Confirming location:', selectedPosition);
      
      try {
        // Ensure we have valid numeric values
        const lat = Number(selectedPosition.lat);
        const lng = Number(selectedPosition.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error(`Invalid coordinates: lat=${selectedPosition.lat}, lng=${selectedPosition.lng}`);
        }
        
        // Make sure we pass valid numerical values
        onSelectLocation(lat, lng, selectedPosition.address);
        console.log('Location confirmed successfully:', { lat, lng, address: selectedPosition.address });
        toast.success('Location confirmed!');
        onClose();
      } catch (error) {
        console.error('Error confirming location:', error);
        toast.error('Failed to confirm location. Please try again.');
      }
    } else {
      console.error('No location selected');
      toast.error('Please select a location first.');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Set Court Location</DialogTitle>
          <DialogDescription>
            Search for a location to set your court position
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-3 max-h-[70vh]">
            <div className="space-y-4 pb-4">
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
                <div className="bg-background border rounded-md max-h-[300px] overflow-y-auto">
                  <ul>
                    {searchResults.map((result) => (
                      <li 
                        key={result.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-0 flex items-center gap-2"
                        onClick={() => selectSearchResult(result)}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{result.place_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPosition && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm font-medium mb-1">Selected Location</div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm break-words">{selectedPosition.address}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Coordinates: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                  </div>
                </div>
              )}
              
              {confirmButtonClicked && !selectedPosition && (
                <Alert variant="destructive" className="py-2 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Please select a location first</AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button 
            onClick={handleSubmit}
            type="button"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 font-medium"
            disabled={!selectedPosition}
          >
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerDialog;
