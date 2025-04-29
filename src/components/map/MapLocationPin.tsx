
import React from 'react';
import mapboxgl from 'mapbox-gl';

interface Location {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: 'court' | 'player' | 'coach' | 'event';
  userData?: any;
  isStaticLocation?: boolean;
  isOwnProfile?: boolean;
  isFollowing?: boolean; // Add flag for people you follow
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
    
    // Style based on location type, with special handling for own location and following
    if (location.isOwnProfile) {
      // Own profile location gets a special style
      el.innerHTML = `<div class="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white border-2 border-white relative">
                        <div class="absolute -inset-1 bg-cyan-500 rounded-full opacity-30"></div>
                        ${location.type === 'coach' ? 'T' : 'P'}
                      </div>`;
    }
    else if (location.isFollowing) {
      // People you follow get a special highlighted style
      switch (location.type) {
        case 'player':
          el.innerHTML = `<div class="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-yellow-400 animate-pulse">P</div>`;
          break;
        case 'coach':
          el.innerHTML = `<div class="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white border-2 border-yellow-400 animate-pulse">T</div>`;
          break;
        default:
          el.innerHTML = `<div class="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center text-white border-2 border-yellow-400">?</div>`;
      }
    }
    else if (location.isStaticLocation) {
      // Static locations (from profile) have a different style with a house icon
      switch (location.type) {
        case 'player':
          el.innerHTML = `<div class="w-6 h-6 bg-blue-300 rounded-full flex items-center justify-center text-white border-2 border-blue-500">P</div>`;
          break;
        case 'coach':
          el.innerHTML = `<div class="w-6 h-6 bg-purple-300 rounded-full flex items-center justify-center text-white border-2 border-purple-500">T</div>`;
          break;
        default:
          el.innerHTML = `<div class="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white">?</div>`;
      }
    } else {
      // Regular active locations
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
    }
    
    // Create and add the marker
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(location.coordinates)
      .addTo(map);
    
    // Add click handler if provided
    if (onClick) {
      el.addEventListener('click', () => {
        onClick(location);
      });
    }
    
    // Add tooltip with name
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
      className: 'marker-popup'
    });

    // Add hover events for the tooltip
    el.addEventListener('mouseenter', () => {
      popup.setLngLat(location.coordinates)
        .setHTML(`<div class="text-sm font-medium">${location.name}</div>
                  ${location.isOwnProfile 
                    ? '<div class="text-xs text-cyan-600 font-medium">Your profile location</div>' 
                    : location.isFollowing
                      ? '<div class="text-xs text-yellow-600 font-medium">You follow this person</div>'
                      : location.isStaticLocation 
                        ? '<div class="text-xs text-muted-foreground">Home location</div>' 
                        : ''}`)
        .addTo(map);
    });

    el.addEventListener('mouseleave', () => {
      popup.remove();
    });
    
    // Clean up on unmount
    return () => {
      marker.remove();
      popup.remove();
    };
  }, [location, map, onClick]);
  
  // This component doesn't render anything directly
  return null;
};

export default MapLocationPin;
