
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
      el.innerHTML = `<div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg relative group transition-all duration-300 hover:scale-110">
                        <div class="absolute -inset-2 bg-cyan-500 rounded-full opacity-20 animate-pulse"></div>
                        <span class="font-semibold">${location.type === 'coach' ? 'T' : 'P'}</span>
                        <span class="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-medium text-cyan-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 shadow-sm">You</span>
                      </div>`;
    }
    else if (location.isFollowing) {
      // People you follow get a special highlighted style
      switch (location.type) {
        case 'player':
          el.innerHTML = `<div class="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white border-2 border-yellow-400 shadow-md animate-pulse-subtle group transition-all duration-300 hover:scale-110">
                            <span class="font-semibold">P</span>
                            <span class="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-medium text-blue-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 shadow-sm">Following</span>
                          </div>`;
          break;
        case 'coach':
          el.innerHTML = `<div class="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white border-2 border-yellow-400 shadow-md animate-pulse-subtle group transition-all duration-300 hover:scale-110">
                            <span class="font-semibold">T</span>
                            <span class="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-medium text-purple-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 shadow-sm">Following</span>
                          </div>`;
          break;
        default:
          el.innerHTML = `<div class="w-7 h-7 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white border-2 border-yellow-400 shadow-md group transition-all duration-300 hover:scale-110">?</div>`;
      }
    }
    else if (location.isStaticLocation) {
      // Static locations (from profile) have a different style with a house icon
      switch (location.type) {
        case 'player':
          el.innerHTML = `<div class="w-6 h-6 bg-blue-300 rounded-full flex items-center justify-center text-white border-2 border-blue-500 shadow-sm group transition-all duration-300 hover:scale-110">
                            <span class="font-medium">P</span>
                            <span class="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-medium text-blue-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 shadow-sm">Home</span>
                          </div>`;
          break;
        case 'coach':
          el.innerHTML = `<div class="w-6 h-6 bg-purple-300 rounded-full flex items-center justify-center text-white border-2 border-purple-500 shadow-sm group transition-all duration-300 hover:scale-110">
                            <span class="font-medium">T</span>
                            <span class="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-medium text-purple-700 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 shadow-sm">Home</span>
                          </div>`;
          break;
        default:
          el.innerHTML = `<div class="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white shadow-sm group transition-all duration-300 hover:scale-110">?</div>`;
      }
    } else {
      // Regular active locations
      switch (location.type) {
        case 'court':
          el.innerHTML = `<div class="w-6 h-6 bg-gradient-to-br from-tennis-green to-tennis-darkGreen rounded-full flex items-center justify-center text-white shadow-sm group transition-all duration-300 hover:scale-110">
                            <span class="font-medium">C</span>
                          </div>`;
          break;
        case 'player':
          el.innerHTML = `<div class="w-6 h-6 bg-gradient-to-br from-tennis-blue to-blue-600 rounded-full flex items-center justify-center text-white shadow-sm group transition-all duration-300 hover:scale-110">
                            <span class="font-medium">P</span>
                          </div>`;
          break;
        case 'coach':
          el.innerHTML = `<div class="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white shadow-sm group transition-all duration-300 hover:scale-110">
                            <span class="font-medium">T</span>
                          </div>`;
          break;
        case 'event':
          el.innerHTML = `<div class="w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white shadow-sm group transition-all duration-300 hover:scale-110">
                            <span class="font-medium">E</span>
                          </div>`;
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
      const popupHTML = `<div class="p-2 rounded-md bg-white/95 backdrop-blur-sm shadow-lg">
                           <div class="text-sm font-semibold">${location.name}</div>
                           ${location.isOwnProfile 
                             ? '<div class="text-xs text-cyan-600 font-medium">Your profile location</div>' 
                             : location.isFollowing
                               ? '<div class="text-xs text-yellow-600 font-medium">You follow this person</div>'
                               : location.isStaticLocation 
                                 ? '<div class="text-xs text-muted-foreground">Home location</div>' 
                                 : ''}
                          </div>`;
      
      popup.setLngLat(location.coordinates)
        .setHTML(popupHTML)
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
