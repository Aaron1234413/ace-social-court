
import React from 'react';
import { MapPin } from 'lucide-react';
import type { LocationCoordinates } from './types';

interface SelectedLocationProps {
  selectedPosition: LocationCoordinates | null;
}

const SelectedLocation: React.FC<SelectedLocationProps> = ({ selectedPosition }) => {
  if (!selectedPosition) {
    return null;
  }

  return (
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
  );
};

export default SelectedLocation;
