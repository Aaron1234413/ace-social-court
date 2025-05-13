
import { UseFormReturn } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { LocationPickerDialog, LocationResult } from '@/components/location';
import type { ProfileFormValues } from '../ProfileEditForm';

interface LocationFieldProps {
  form: UseFormReturn<ProfileFormValues>;
  locationName: string;
  isLocationPickerOpen: boolean;
  setIsLocationPickerOpen: (isOpen: boolean) => void;
  openLocationPicker: () => void;
  onSelectLocation: (lat: number, lng: number, address: string) => void;
}

export const LocationField = ({ 
  form, 
  locationName, 
  isLocationPickerOpen, 
  setIsLocationPickerOpen,
  openLocationPicker,
  onSelectLocation
}: LocationFieldProps) => {
  const handleLocationSelect = (location: LocationResult) => {
    onSelectLocation(location.lat, location.lng, location.address);
  };
  
  return (
    <>
      <Card className="border border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Location</CardTitle>
          <CardDescription>
            Set your home location to appear on the map when you're not actively sharing your position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                {locationName || form.watch('location_name') || 'No location set'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={openLocationPicker}
                className="text-sm"
              >
                {form.watch('latitude') ? 'Change Location' : 'Set Location'}
              </Button>
              {form.watch('latitude') && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    form.setValue('latitude', undefined);
                    form.setValue('longitude', undefined);
                    form.setValue('location_name', '');
                    console.log('Location cleared, form values:', form.getValues());
                  }}
                  className="text-sm text-destructive"
                >
                  Remove
                </Button>
              )}
            </div>
            {/* Display current coordinate values for debugging */}
            {form.watch('latitude') && (
              <div className="text-xs text-muted-foreground">
                Coordinates: {form.watch('latitude')?.toFixed(6)}, {form.watch('longitude')?.toFixed(6)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LocationPickerDialog 
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
};
