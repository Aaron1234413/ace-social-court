
import { useState } from 'react';
import { toast } from 'sonner';
import type { LocationResult } from './types';

// User-provided Mapbox token (primary)
const USER_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWFyb24yMWNhbXBvcyIsImEiOiJjbWEydXkyZXExNW5rMmpxNmh5eGs5NmgyIn0.GyTAYck1VjlY0OWF8e6Y7w';
// Fallback Ace Social Mapbox token
const ACE_SOCIAL_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWNlc29jaWFsIiwiYSI6ImNscGsxY3pzZjIzb2gya3A1cnhwM2Rnb2UifQ.NuO33X9W3CNpUyTKT7_X2Q';

export const useLocationSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    console.log('Searching for:', searchQuery);
    
    try {
      const mapboxToken = USER_MAPBOX_TOKEN || ACE_SOCIAL_MAPBOX_TOKEN;
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        // Transform Mapbox results to our LocationResult format
        const formattedResults = data.features.map((feature: any) => ({
          id: feature.id,
          lat: feature.center[1],
          lng: feature.center[0],
          address: feature.place_name,
          place_name: feature.place_name
        }));
        
        setSearchResults(formattedResults);
        console.log('Search results:', formattedResults);
      } else {
        setSearchError('No locations found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchError('Location search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    searchError,
    handleSearch,
    // For backward compatibility (these are now deprecated)
    results: searchResults,
    searchLocations: handleSearch
  };
};
