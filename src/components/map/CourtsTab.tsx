
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import { useMapData } from '@/hooks/useMapData';
import NearbyCourtsPanel from './NearbyCourtsPanel';
import TennisCourtCard from './TennisCourtCard';

const CourtsTab: React.FC = () => {
  const { 
    handleFilterChange,
    filters,
    courtsPage,
    setCourtsPage,
    mapInstance,
    selectedCourt,
  } = useMapExplorer();
  
  const { 
    nearbyCourts, 
    isLoadingCourts, 
    refetchCourts, 
    totalPages,
    availableStates
  } = useMapData();
  
  const handlePrevPage = () => {
    if (courtsPage > 1) {
      setCourtsPage(courtsPage - 1);
    }
  };

  const handleNextPage = () => {
    if (courtsPage < totalPages) {
      setCourtsPage(courtsPage + 1);
    }
  };

  return (
    <>
      <NearbyCourtsPanel
        courts={nearbyCourts || []}
        isLoading={isLoadingCourts}
        onCourtSelect={(court) => {
          if (mapInstance && court.latitude && court.longitude) {
            mapInstance.flyTo({
              center: [court.longitude, court.latitude],
              zoom: 16,
              essential: true
            });
          }
        }}
        onRetry={refetchCourts}
        currentPage={courtsPage}
        totalPages={totalPages}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        stateFilter={filters.state}
        onChangeStateFilter={(state) => handleFilterChange('state', state)}
        availableStates={availableStates || []}
      />
      
      {selectedCourt && (
        <TennisCourtCard
          court={selectedCourt}
          onViewOnMap={() => {
            if (mapInstance && selectedCourt.latitude && selectedCourt.longitude) {
              mapInstance.flyTo({
                center: [selectedCourt.longitude, selectedCourt.latitude],
                zoom: 16,
                essential: true
              });
            }
          }}
        />
      )}
    </>
  );
};

export default CourtsTab;
