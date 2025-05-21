
import React from 'react';
import { Helmet } from 'react-helmet-async';
import MapExplorerComponent from '@/components/map/MapExplorer';

const MapExplorer = () => {
  return (
    <>
      <Helmet>
        <title>Explore Tennis - rallypointx</title>
        <meta name="description" content="Explore tennis courts, players, and coaches near you" />
      </Helmet>
      <MapExplorerComponent />
    </>
  );
};

export default MapExplorer;
