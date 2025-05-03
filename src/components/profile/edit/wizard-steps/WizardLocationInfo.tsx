
import { Control } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { LocationPickerDialog } from '@/components/location';
import type { ProfileFormValues } from '../profileSchema';

interface WizardLocationInfoProps {
  control: Control<ProfileFormValues>;
  locationName: string;
  isLocationPickerOpen: boolean;
  setIsLocationPickerOpen: (isOpen: boolean) => void;
  handleSetLocation: (lat: number, lng: number, address: string) => void;
}

export const WizardLocationInfo = ({ 
  control, 
  locationName, 
  isLocationPickerOpen, 
  setIsLocationPickerOpen,
  handleSetLocation
}: WizardLocationInfoProps) => {
  return (
    <>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h2 className="text-xl font-semibold">Your Location</h2>
          <p className="text-muted-foreground">
            Set your home location to appear on the map when you're not actively sharing your position.
            This helps other players and coaches find you.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{locationName || 'No location set'}</span>
            </div>
            
            <div>
              <Button 
                type="button" 
                onClick={() => setIsLocationPickerOpen(true)}
              >
                {locationName ? 'Change Location' : 'Set Location'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLocationPickerOpen && (
        <LocationPickerDialog 
          isOpen={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          onSelectLocation={handleSetLocation}
          initialLatitude={undefined}
          initialLongitude={undefined}
        />
      )}
    </>
  );
};

export default WizardLocationInfo;
