
import React from 'react';
import { MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { LocationResult } from './types';

interface LocationSearchResultsProps {
  searchResults: LocationResult[];
  searchError: string | null;
  onSelectResult: (result: LocationResult) => void;
}

const LocationSearchResults: React.FC<LocationSearchResultsProps> = ({
  searchResults,
  searchError,
  onSelectResult
}) => {
  if (searchError) {
    return (
      <Alert variant="destructive" className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{searchError}</AlertDescription>
      </Alert>
    );
  }

  if (searchResults.length === 0) {
    return null;
  }

  return (
    <div className="bg-background border rounded-md max-h-[300px] overflow-y-auto">
      <ul>
        {searchResults.map((result) => (
          <li 
            key={result.id}
            className="p-3 hover:bg-muted cursor-pointer border-b last:border-0 flex items-center gap-2"
            onClick={() => onSelectResult(result)}
          >
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">{result.place_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LocationSearchResults;
