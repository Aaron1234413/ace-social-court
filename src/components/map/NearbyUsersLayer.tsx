
import React from 'react';
import MapLocationPin from './MapLocationPin';

export type NearbyUser = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  user_type: string;
  distance: number;
  latitude: number;
  longitude: number;
  location_name?: string;
  is_static_location?: boolean;
};

interface NearbyUsersLayerProps {
  users: NearbyUser[];
  map: mapboxgl.Map | null;
  filters: {
    showPlayers: boolean;
    showCoaches: boolean;
  };
  onSelectUser: (user: NearbyUser) => void;
}

const NearbyUsersLayer = ({ users, map, filters, onSelectUser }: NearbyUsersLayerProps) => {
  // Filter users based on filters
  const filteredUsers = users.filter(user => {
    if (user.user_type === 'player') return filters.showPlayers;
    if (user.user_type === 'coach') return filters.showCoaches;
    return false;
  });
  
  // Convert users to map location objects
  const userLocations = filteredUsers.map(user => ({
    id: user.id,
    name: user.full_name || user.username || 'Tennis Player',
    coordinates: [user.longitude, user.latitude] as [number, number],
    type: user.user_type as 'player' | 'coach',
    userData: user,
    isStaticLocation: user.is_static_location || false
  }));
  
  // Handle user selection on map
  const handleLocationClick = (location: any) => {
    if (location.userData) {
      onSelectUser(location.userData);
    }
  };
  
  return (
    <>
      {userLocations.map(location => (
        <MapLocationPin
          key={location.id}
          location={location}
          map={map}
          onClick={handleLocationClick}
        />
      ))}
    </>
  );
};

export default NearbyUsersLayer;
