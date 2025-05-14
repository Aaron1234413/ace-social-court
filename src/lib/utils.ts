
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mapping utilities for coordinates
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' && 
    !isNaN(lat) && 
    !isNaN(lng) && 
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180
  );
}

export function formatCoordinates(lat: number, lng: number): string {
  if (!isValidCoordinates(lat, lng)) {
    return 'Invalid coordinates';
  }
  
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function coordinatesToPosition(coordinates: [number, number]): { lat: number, lng: number } {
  const [longitude, latitude] = coordinates;
  return { lat: latitude, lng: longitude };
}
