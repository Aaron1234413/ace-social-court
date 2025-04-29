
import React from 'react';
import TennisCourtMarker from './TennisCourtMarker';

export interface TennisCourt {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  surface_type: string | null;
  is_public: boolean;
  distance?: number; // Make distance optional
}

interface TennisCourtsLayerProps {
  courts: TennisCourt[];
  map: mapboxgl.Map | null;
  onSelectCourt: (court: TennisCourt) => void;
}

const TennisCourtsLayer = ({ courts, map, onSelectCourt }: TennisCourtsLayerProps) => {
  // Convert courts to map location objects with the correct structure
  const courtLocations = courts.map(court => ({
    id: court.id,
    name: court.name,
    description: court.description,
    coordinates: [court.longitude, court.latitude] as [number, number],
    address: court.address,
    city: court.city,
    state: court.state,
    country: court.country,
    surface_type: court.surface_type,
    is_public: court.is_public,
    distance: court.distance
  }));
  
  return (
    <>
      {courtLocations.map(courtLocation => (
        <TennisCourtMarker
          key={courtLocation.id}
          court={courtLocation}
          map={map}
          onClick={(courtData) => {
            // Convert back to the TennisCourt format expected by onSelectCourt
            const originalCourt = courts.find(c => c.id === courtData.id);
            if (originalCourt) {
              onSelectCourt(originalCourt);
            }
          }}
        />
      ))}
    </>
  );
};

export default TennisCourtsLayer;
