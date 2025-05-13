import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LocationSearchBox from "./LocationSearchBox";
import { useState } from "react";
import { toast } from "sonner";
import { LocationResult } from "./types";
import SelectedLocation from "./SelectedLocation";

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (location: LocationResult) => void;
  initialLocation?: LocationResult | null;
}

const LocationPickerDialog = ({
  open,
  onOpenChange,
  onLocationSelect,
  initialLocation = null,
}: LocationPickerDialogProps) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(initialLocation);

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onOpenChange(false);
    } else {
      toast.error("Please select a location");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <LocationSearchBox onLocationSelect={handleLocationSelect} />
          
          {selectedLocation && (
            <SelectedLocation 
              location={selectedLocation} 
              onConfirm={handleConfirm} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerDialog;
