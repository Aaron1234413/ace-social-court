
export interface LocationResult {
  id: string;
  place_name: string;
  center: [number, number];
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address: string;
}

export interface LocationPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address: string) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}
