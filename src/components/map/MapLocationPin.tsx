
import React from 'react';
import { Marker } from 'mapbox-gl';

interface Location {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: 'court' | 'player' | 'coach' | 'event';
}

interface MapLocationPinProps {
  location: Location;
  map: mapboxgl.Map | null;
  onClick?: (location: Location) => void;
}

// This component will not render anything directly
// It adds a marker to the map and manages its lifecycle
const MapLocationPin = ({ location, map, onClick }: MapLocationPinProps) => {
  React.useEffect(() => {
    if (!map) return;
    
    // Create a custom element for the marker
    const el = document.createElement('div');
    el.className = 'marker';
    
    // Style based on location type
    switch (location.type) {
      case 'court':
        el.innerHTML = `<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">C</div>`;
        break;
      case 'player':
        el.innerHTML = `<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">P</div>`;
        break;
      case 'coach':
        el.innerHTML = `<div class="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white">T</div>`;
        break;
      case 'event':
        el.innerHTML = `<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">E</div>`;
        break;
    }
    
    // Create and add the marker
    const marker = new Marker({ element: el })
      .setLngLat(location.coordinates)
      .addTo(map);
    
    // Add click handler if provided
    if (onClick) {
      el.addEventListener('click', () => {
        onClick(location);
      });
    }
    
    // Clean up on unmount
    return () => {
      marker.remove();
    };
  }, [location, map, onClick]);
  
  // This component doesn't render anything directly
  return null;
};

export default MapLocationPin;
