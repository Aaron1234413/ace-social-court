
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocationSearch } from './useLocationSearch';
import LocationSearchBox from './LocationSearchBox';
import LocationSearchResults from './LocationSearchResults';
import SelectedLocation from './SelectedLocation';
import type { LocationCoordinates, LocationPickerDialogProps, LocationResult } from './types';

const LocationPickerDialog: React.FC<LocationPickerDialogProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLatitude,
  initialLongitude
}) => {
  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    searchError,
    handleSearch
  } = useLocationSearch();

  const [selectedPosition, setSelectedPosition] = useState<LocationCoordinates | null>(
    initialLatitude && initialLongitude ? {
      lat: initialLatitude,
      lng: initialLongitude,
      address: ''
    } : null
  );
  
  const [confirmButtonClicked, setConfirmButtonClicked] = useState(false);

  // Handle key press for search input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Select a location from search results
  const selectSearchResult = (result: LocationResult) => {
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
              <LocationSearchBox 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                isSearching={isSearching}
                onKeyPress={handleKeyPress}
              />

              <LocationSearchResults 
                searchResults={searchResults}
                searchError={searchError}
                onSelectResult={selectSearchResult}
              />

              <SelectedLocation selectedPosition={selectedPosition} />
              
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
