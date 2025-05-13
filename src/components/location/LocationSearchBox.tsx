
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { LocationResult } from './types';
import { useLocationSearch } from './useLocationSearch';

interface LocationSearchBoxProps {
  onLocationSelect: (location: LocationResult) => void;
}

const LocationSearchBox: React.FC<LocationSearchBoxProps> = ({
  onLocationSelect
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { searchLocations, results, isSearching, searchResults } = useLocationSearch();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchLocations(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleLocationClick = (location: LocationResult) => {
    onLocationSelect(location);
  };

  // Use either results or searchResults (whichever is available)
  const locationResults = results || searchResults || [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search for a location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isSearching || !searchQuery.trim()}
          type="button"
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {locationResults.length > 0 && (
        <ul className="bg-background border rounded-md divide-y max-h-60 overflow-auto">
          {locationResults.map((result, index) => (
            <li 
              key={`${result.id || `${result.lat}-${result.lng}-${index}`}`} 
              className="p-2 hover:bg-muted cursor-pointer text-sm"
              onClick={() => handleLocationClick(result)}
            >
              {result.address}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearchBox;
