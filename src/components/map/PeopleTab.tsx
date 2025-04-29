
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import { useMapData } from '@/hooks/useMapData';
import NearbyUsersList from './NearbyUsersList';
import LocationStatusCard from './LocationStatusCard';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="space-y-3 md:space-y-4">
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
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <h3 className="font-semibold mb-1 text-sm md:text-base">{selectedUser.full_name || selectedUser.username}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {selectedUser.user_type === 'coach' ? 'Tennis Coach' : 'Tennis Player'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PeopleTab;
