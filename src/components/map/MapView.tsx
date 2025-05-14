
import React from 'react';
import MapContainer from '@/components/map/MapContainer';
import NearbyUsersLayer from '@/components/map/NearbyUsersLayer';
import TennisCourtsLayer from '@/components/map/TennisCourtsLayer';
import { Loader2 } from 'lucide-react';
import { TennisCourt } from './TennisCourtsLayer';

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
  nearbyCourts: TennisCourt[] | null;
  filters: {
    showPlayers: boolean;
    showCoaches: boolean;
    showCourts: boolean;
    showOwnLocation?: boolean;
    showFollowing?: boolean;
  };
  onSelectUser: (user: any) => void;
  onSelectCourt: (court: TennisCourt) => void;
}

const MapView: React.FC<MapViewProps> = ({
  isReady,
  locationPrivacy,
  onMapInitialized,
  onUserPositionUpdate,
  mapInstance,
  nearbyUsers,
  nearbyCourts,
  filters,
  onSelectUser,
  onSelectCourt
}) => {
  // Adjust map height based on screen size
  const mapHeight = "h-[50vh] sm:h-[60vh] md:h-[65vh] lg:h-[70vh]";
  
  return (
    <>
      {isReady ? (
        <MapContainer 
          className="rounded-lg shadow-md overflow-hidden" 
          height={mapHeight} 
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
                showOwnLocation: filters.showOwnLocation || false,
                showFollowing: filters.showFollowing || false
              }}
              onSelectUser={onSelectUser}
            />
          )}
          
          {mapInstance && nearbyCourts && filters.showCourts && (
            <TennisCourtsLayer
              courts={nearbyCourts}
              map={mapInstance}
              onSelectCourt={onSelectCourt}
            />
          )}
        </MapContainer>
      ) : (
        <div className={`rounded-lg shadow-md ${mapHeight} flex items-center justify-center bg-muted`}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </>
  );
};

export default MapView;
