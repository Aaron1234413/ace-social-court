
import React from 'react';
import { Helmet } from 'react-helmet-async';
import MapExplorerComponent from '@/components/map/MapExplorer';
import { MapExplorerProvider } from '@/contexts/MapExplorerContext';

const MapExplorer = () => {
  return (
    <>
      <Helmet>
        <title>Explore Tennis - rallypointx</title>
        <meta name="description" content="Explore tennis courts, players, and coaches near you" />
      </Helmet>
      <MapExplorerProvider>
        <MapExplorerComponent />
      </MapExplorerProvider>
    </>
  );
};

export default MapExplorer;
