
import React, { useState } from 'react';
import MapContainer from '@/components/map/MapContainer';
import NearbyUsersLayer from '@/components/map/NearbyUsersLayer';
import { Loader2 } from 'lucide-react';

interface MapViewProps {
  isReady: boolean;
  locationPrivacy: {
    shareExactLocation: boolean;
    showOnMap: boolean;
    locationHistory: boolean;
  };
  onMapInitialized: (map: mapboxgl.Map) => void;
  onUserPositionUpdate: (position: {lng: number, lat: number}) => void;
  mapInstance: mapboxgl.Map | null;
  nearbyUsers: any[] | null;
  filters: {
    showPlayers: boolean;
    showCoaches: boolean;
    showOwnLocation?: boolean; // Added filter
  };
  onSelectUser: (user: any) => void;
}

const MapView: React.FC<MapViewProps> = ({
  isReady,
  locationPrivacy,
  onMapInitialized,
  onUserPositionUpdate,
  mapInstance,
  nearbyUsers,
  filters,
  onSelectUser
}) => {
  return (
    <>
      {isReady ? (
        <MapContainer 
          className="rounded-lg shadow-md" 
          height="h-[70vh]" 
          locationPrivacySettings={locationPrivacy}
          onMapInitialized={onMapInitialized}
          onUserPositionUpdate={onUserPositionUpdate}
        >
          {mapInstance && nearbyUsers && (
            <NearbyUsersLayer 
              users={nearbyUsers} 
              map={mapInstance}
              filters={{
                showPlayers: filters.showPlayers,
                showCoaches: filters.showCoaches,
                showOwnLocation: filters.showOwnLocation || false
              }}
              onSelectUser={onSelectUser}
            />
          )}
        </MapContainer>
      ) : (
        <div className="rounded-lg shadow-md h-[70vh] flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </>
  );
};

export default MapView;
