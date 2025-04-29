
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
  is_own_profile?: boolean;
  is_following?: boolean; // Add flag to indicate if user is being followed
};

interface NearbyUsersLayerProps {
  users: NearbyUser[];
  map: mapboxgl.Map | null;
  filters: {
    showPlayers: boolean;
    showCoaches: boolean;
    showOwnLocation?: boolean;
    showFollowing?: boolean; // Add this new filter option
  };
  onSelectUser: (user: NearbyUser) => void;
}

const NearbyUsersLayer = ({ users, map, filters, onSelectUser }: NearbyUsersLayerProps) => {
  // Filter users based on filters
  const filteredUsers = users.filter(user => {
    // Handle user's own profile location separately
    if (user.is_own_profile && filters.showOwnLocation === false) {
      return false;
    }
    
    // If showFollowing is active, only show users that are being followed
    if (filters.showFollowing === true) {
      if (!user.is_following && !user.is_own_profile) {
        return false;
      }
    }
    
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
    isStaticLocation: user.is_static_location || false,
    isOwnProfile: user.is_own_profile || false,
    isFollowing: user.is_following || false, // Pass this property to the marker
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
