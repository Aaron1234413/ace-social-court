
import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LocationResult } from './types';

interface SelectedLocationProps {
  location: LocationResult;
  onConfirm: () => void;
}

const SelectedLocation: React.FC<SelectedLocationProps> = ({ 
  location,
  onConfirm 
}) => {
  return (
    <div className="space-y-3">
      <div className="bg-muted p-3 rounded-md">
        <div className="text-sm font-medium mb-1">Selected Location</div>
        <div className="flex items-center gap-2 mt-1">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm break-words">{location.address}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onConfirm} type="button">
          Confirm Location
        </Button>
      </div>
    </div>
  );
};

export default SelectedLocation;
