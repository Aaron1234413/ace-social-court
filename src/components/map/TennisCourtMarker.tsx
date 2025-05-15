
import React from 'react';
import mapboxgl from 'mapbox-gl';

interface TennisCourtLocation {
  id: string;
  name: string;
  description?: string | null;
  coordinates: [number, number]; // [longitude, latitude]
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  surface_type?: string | null;
  is_public: boolean;
  distance?: number;
}

interface TennisCourtMarkerProps {
  court: TennisCourtLocation;
  map: mapboxgl.Map | null;
  onClick?: (court: TennisCourtLocation) => void;
}

const TennisCourtMarker = ({ court, map, onClick }: TennisCourtMarkerProps) => {
  React.useEffect(() => {
    if (!map) return;
    
    // Create a custom element for the marker
    const el = document.createElement('div');
    el.className = 'tennis-court-marker';
    
    // Get background color based on surface type
    const getBgColor = () => {
      if (!court.surface_type) return 'bg-tennis-green';
      
      const surfaceType = court.surface_type.toLowerCase();
      if (surfaceType.includes('clay')) return 'bg-tennis-clay';
      if (surfaceType.includes('grass')) return 'bg-tennis-grass';
      if (surfaceType.includes('hard')) return 'bg-tennis-blue';
      return 'bg-tennis-green';
    };
    
    // Tennis court marker styling
    el.innerHTML = `
      <div class="${getBgColor()} w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="4" width="6" height="16" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </div>
    `;
    
    // Create and add the marker
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(court.coordinates)
      .addTo(map);
    
    // Add click handler if provided
    if (onClick) {
      el.addEventListener('click', () => {
        onClick(court);
      });
    }
    
    // Get badge color based on type
    const getBadgeColor = () => {
      if (!court.surface_type) return 'text-tennis-green';
      
      const surfaceType = court.surface_type.toLowerCase();
      if (surfaceType.includes('clay')) return 'text-tennis-clay';
      if (surfaceType.includes('grass')) return 'text-tennis-grass';
      if (surfaceType.includes('hard')) return 'text-tennis-blue';
      return 'text-tennis-green';
    };
    
    // Add tooltip with name and info
    const popupContent = `
      <div class="p-2 rounded-md bg-white/95 backdrop-blur-sm shadow-lg">
        <div class="text-sm font-semibold">${court.name}</div>
        ${court.surface_type ? `<div class="text-xs ${getBadgeColor()} font-medium">${court.surface_type} surface</div>` : ''}
        ${court.distance !== undefined ? `<div class="text-xs text-muted-foreground">${court.distance.toFixed(1)} miles away</div>` : ''}
        ${court.is_public ? '<div class="text-xs text-tennis-green font-medium">Public</div>' : '<div class="text-xs text-amber-600 font-medium">Private</div>'}
      </div>
    `;
    
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
      className: 'court-popup'
    });

    // Add hover events for the tooltip
    el.addEventListener('mouseenter', () => {
      popup.setLngLat(court.coordinates)
        .setHTML(popupContent)
        .addTo(map);
      
      // Add pulse animation on hover
      el.querySelector('div')?.classList.add('animate-pulse');
    });

    el.addEventListener('mouseleave', () => {
      popup.remove();
      el.querySelector('div')?.classList.remove('animate-pulse');
    });
    
    // Clean up on unmount
    return () => {
      marker.remove();
      popup.remove();
    };
  }, [court, map, onClick]);
  
  // This component doesn't render anything directly
  return null;
};

export default TennisCourtMarker;
