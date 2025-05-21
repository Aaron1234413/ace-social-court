
import React from 'react';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchFilters as SearchFiltersType } from '@/hooks/useSearch';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  setFilters: (filters: SearchFiltersType) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  const handleUserTypeChange = (value: string[]) => {
    setFilters({ ...filters, userType: value });
  };
  
  const handleSortByChange = (value: string) => {
    setFilters({ 
      ...filters, 
      sortBy: value as 'relevance' | 'distance' | 'rating' | 'newest' 
    });
  };
  
  const resetFilters = () => {
    setFilters({
      userType: [],
      sortBy: 'relevance',
      nearby: false
    });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label className="block mb-2">User Type</Label>
        <ToggleGroup 
          type="multiple" 
          variant="outline" 
          value={filters.userType} 
          onValueChange={handleUserTypeChange} 
          className="flex flex-wrap gap-2"
        >
          <ToggleGroupItem value="player" aria-label="Filter by players" className="rounded-full data-[state=on]:bg-tennis-green/20 data-[state=on]:text-tennis-darkGreen">
            <Badge className="bg-tennis-green/10 text-tennis-darkGreen hover:bg-tennis-green/20 border-none">
              Players
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="coach" aria-label="Filter by coaches" className="rounded-full data-[state=on]:bg-tennis-green/20 data-[state=on]:text-tennis-darkGreen">
            <Badge className="bg-tennis-green/10 text-tennis-darkGreen hover:bg-tennis-green/20 border-none">
              Coaches
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="nearby" aria-label="Filter by nearby" className="rounded-full data-[state=on]:bg-tennis-green/20 data-[state=on]:text-tennis-darkGreen">
            <Badge className="bg-tennis-green/10 text-tennis-darkGreen hover:bg-tennis-green/20 border-none">
              Nearby
            </Badge>
          </ToggleGroupItem>
          <ToggleGroupItem value="rated" aria-label="Filter by rating" className="rounded-full data-[state=on]:bg-tennis-green/20 data-[state=on]:text-tennis-darkGreen">
            <Badge className="bg-tennis-green/10 text-tennis-darkGreen hover:bg-tennis-green/20 border-none">
              Rated 4.0+
            </Badge>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Label htmlFor="sort-by">Sort By</Label>
          <Select value={filters.sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-[180px]" id="sort-by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={resetFilters}
          className="text-sm"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default SearchFilters;
