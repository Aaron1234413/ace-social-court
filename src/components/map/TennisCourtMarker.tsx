
import React from 'react';
import mapboxgl from 'mapbox-gl';
import { MapPin } from 'lucide-react';

interface TennisCourt {
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
  court: TennisCourt;
  map: mapboxgl.Map | null;
  onClick?: (court: TennisCourt) => void;
}

const TennisCourtMarker = ({ court, map, onClick }: TennisCourtMarkerProps) => {
  React.useEffect(() => {
    if (!map) return;
    
    // Create a custom element for the marker
    const el = document.createElement('div');
    el.className = 'tennis-court-marker';
    
    // Tennis court marker styling
    el.innerHTML = `
      <div class="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md">
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
    
    // Add tooltip with name and info
    const popupContent = `
      <div>
        <div class="text-sm font-medium">${court.name}</div>
        ${court.surface_type ? `<div class="text-xs">${court.surface_type} surface</div>` : ''}
        ${court.distance !== undefined ? `<div class="text-xs text-muted-foreground">${court.distance.toFixed(1)} miles away</div>` : ''}
        ${court.is_public ? '<div class="text-xs text-green-600">Public</div>' : '<div class="text-xs text-amber-600">Private</div>'}
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
    });

    el.addEventListener('mouseleave', () => {
      popup.remove();
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
