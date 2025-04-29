
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import { useMapData } from '@/hooks/useMapData';
import NearbyUsersList from './NearbyUsersList';
import LocationStatusCard from './LocationStatusCard';

const PeopleTab: React.FC = () => {
  const { 
    user,
    userLocationEnabled,
    locationPrivacy,
    userPosition,
    mapInstance,
    handleUserSelect,
    selectedUser
  } = useMapExplorer();
  
  const { nearbyUsers, isLoadingNearbyUsers, userProfileLocation } = useMapData();
  
  return (
    <>
      <NearbyUsersList 
        users={nearbyUsers || []}
        isLoading={isLoadingNearbyUsers || !userPosition}
        onUserSelect={handleUserSelect}
      />
      
      <LocationStatusCard 
        isLoggedIn={!!user}
        userLocationEnabled={userLocationEnabled}
        locationPrivacy={locationPrivacy}
        userPosition={userPosition}
        mapInstance={mapInstance}
        profileLocation={userProfileLocation}
        onViewProfileLocation={() => userProfileLocation && handleUserSelect(userProfileLocation)}
      />
      
      {selectedUser && (
        <div className="bg-background rounded-lg border shadow-sm p-4">
          <h3 className="font-semibold mb-2">{selectedUser.full_name || selectedUser.username}</h3>
          <p className="text-sm text-muted-foreground">
            {selectedUser.user_type === 'coach' ? 'Tennis Coach' : 'Tennis Player'}
          </p>
        </div>
      )}
    </>
  );
};

export default PeopleTab;
