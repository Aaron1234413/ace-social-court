
import React, { useEffect } from 'react';
import { toast } from 'sonner';

// Import the context provider
import { MapExplorerProvider, useMapExplorer } from '@/contexts/MapExplorerContext';

// Import components
import MapView from '@/components/map/MapView';
import MapHeader from '@/components/map/MapHeader';
import LocationErrorAlert from '@/components/map/LocationErrorAlert';
import TabNavigator from '@/components/map/TabNavigator';
import PeopleTab from '@/components/map/PeopleTab';
import CourtsTab from '@/components/map/CourtsTab';
import { useMapData } from '@/hooks/useMapData';

const MapExplorerContent = () => {
  const {
    isReady,
    locationPrivacy,
    handleUserPositionUpdate,
    mapInstance,
    setMapInstance,
    filters,
    handleUserSelect,
    handleCourtSelect,
    activeTab,
    userProfileLocation,
  } = useMapExplorer();
  
  const { nearbyUsers, nearbyCourts } = useMapData();

  // If we have the user's profile location and there's a map instance, offer to show it
  useEffect(() => {
    if (mapInstance && userProfileLocation && filters.showOwnLocation) {
      // Only show this once when the map loads
      const timer = setTimeout(() => {
        toast.info(
          <div className="cursor-pointer" onClick={() => handleUserSelect(userProfileLocation)}>
            Click to view your profile location
          </div>,
          { duration: 5000 }
        );
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [mapInstance, userProfileLocation, filters.showOwnLocation, handleUserSelect]);

  return (
    <div className="container py-4 px-4 md:px-6">
      <MapHeader />
      <LocationErrorAlert />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MapView 
            isReady={isReady}
            locationPrivacy={locationPrivacy}
            onMapInitialized={setMapInstance}
            onUserPositionUpdate={handleUserPositionUpdate}
            mapInstance={mapInstance}
            nearbyUsers={nearbyUsers}
            nearbyCourts={nearbyCourts}
            filters={{
              showPlayers: filters.showPlayers,
              showCoaches: filters.showCoaches,
              showCourts: filters.showCourts,
              showOwnLocation: filters.showOwnLocation,
              showFollowing: filters.showFollowing, // Pass the new filter option
            }}
            onSelectUser={handleUserSelect}
            onSelectCourt={handleCourtSelect}
          />
        </div>
        
        <div className="space-y-4">
          <TabNavigator />
          
          {activeTab === 'people' ? (
            <PeopleTab />
          ) : (
            <CourtsTab />
          )}
        </div>
      </div>
    </div>
  );
};

const MapExplorer = () => {
  return (
    <MapExplorerProvider>
      <MapExplorerContent />
    </MapExplorerProvider>
  );
};

export default MapExplorer;
