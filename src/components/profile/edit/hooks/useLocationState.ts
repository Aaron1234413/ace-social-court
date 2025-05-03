
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../profileSchema';
import { toast } from 'sonner';

export const useLocationState = (form: UseFormReturn<ProfileFormValues>) => {
  const [locationName, setLocationName] = useState<string>('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const handleSetLocation = (lat: number, lng: number, address: string) => {
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Invalid location coordinates. Please try again.');
      return;
    }
    
    const parsedLat = parseFloat(Number(lat).toFixed(6));
    const parsedLng = parseFloat(Number(lng).toFixed(6));
    
    form.setValue('latitude', parsedLat);
    form.setValue('longitude', parsedLng);
    form.setValue('location_name', address);
    setLocationName(address);
    
    setIsLocationPickerOpen(false);
    toast.success('Location set successfully');
  };

  return {
    locationName,
    setLocationName,
    isLocationPickerOpen,
    setIsLocationPickerOpen,
    handleSetLocation
  };
};
