
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import MapFiltersSheet from './MapFiltersSheet';
import AddTennisCourtDialog from './AddTennisCourtDialog';

const MapHeader: React.FC = () => {
  const { 
    locationError, 
    filters, 
    handleFilterChange,
    locationPrivacy, 
    togglePrivacySetting,
    userLocationEnabled,
    user
  } = useMapExplorer();
  
  return (
    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between w-full space-y-2 xs:space-y-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Tennis Map</h1>
        <p className="text-sm text-muted-foreground">Find courts, players, and coaches near you</p>
      </div>
      
      <div className="flex flex-col xs:flex-row gap-2">
        <AddTennisCourtDialog />
        <MapFiltersSheet 
          filters={filters} 
          onFilterChange={handleFilterChange}
          locationPrivacy={locationPrivacy}
          onPrivacyChange={togglePrivacySetting}
          userLocationEnabled={userLocationEnabled}
          isUserLoggedIn={!!user}
        />
      </div>
    </div>
  );
};

export default MapHeader;
