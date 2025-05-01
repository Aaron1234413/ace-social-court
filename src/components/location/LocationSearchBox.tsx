
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

interface LocationSearchBoxProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  isSearching: boolean;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const LocationSearchBox: React.FC<LocationSearchBoxProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearching,
  onKeyPress
}) => {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Search for a location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={onKeyPress}
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
  );
};

export default LocationSearchBox;
