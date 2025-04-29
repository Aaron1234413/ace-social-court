
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import MapFiltersSheet from './MapFiltersSheet';

const MapHeader: React.FC = () => {
  const { filters, locationPrivacy, togglePrivacySetting, handleFilterChange, userLocationEnabled, user, locationError } = useMapExplorer();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Tennis Map</h1>
        <p className="text-muted-foreground">Find courts, players, and coaches near you</p>
      </div>
      
      <MapFiltersSheet 
        filters={filters}
        onFilterChange={handleFilterChange}
        locationPrivacy={locationPrivacy}
        onPrivacyChange={togglePrivacySetting}
        userLocationEnabled={userLocationEnabled}
        isUserLoggedIn={!!user}
      />
    </div>
  );
};

export default MapHeader;
