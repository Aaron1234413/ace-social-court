
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
import AddTennisCourtDialog from '@/components/map/AddTennisCourtDialog';

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
    <div className="container max-w-full px-2 py-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <MapHeader />
        <div className="flex-shrink-0">
          <AddTennisCourtDialog />
        </div>
      </div>
      
      <LocationErrorAlert />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Map takes full width on mobile/tablet, 2/3 on desktop */}
        <div className="w-full lg:col-span-2">
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
              showFollowing: filters.showFollowing,
            }}
            onSelectUser={handleUserSelect}
            onSelectCourt={handleCourtSelect}
          />
        </div>
        
        {/* Sidebar takes full width on mobile/tablet, 1/3 on desktop */}
        <div className="w-full mt-3 lg:mt-0">
          <div className="bg-card rounded-lg border shadow-sm p-3 md:p-4 space-y-3 md:space-y-4">
            <TabNavigator />
            
            <div className="h-full">
              {activeTab === 'people' ? (
                <PeopleTab />
              ) : (
                <CourtsTab />
              )}
            </div>
          </div>
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
