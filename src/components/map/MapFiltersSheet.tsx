
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings, MapPin, Users, UserCog, Map, CircleSlash, Heart, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import LocationPrivacyControl from "./LocationPrivacyControl";
import { useMapExplorer } from "@/contexts/MapExplorerContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Define props interface for the component
interface FilterSettings {
  showCourts: boolean;
  showPlayers: boolean;
  showCoaches: boolean;
  showEvents?: boolean;
  showStaticLocations?: boolean;
  showOwnLocation?: boolean;
  showFollowing?: boolean;
  distance: number;
  state?: string | null;
  skillLevel?: string | null;
  locationSearch?: string | null;
}

interface LocationPrivacySettings {
  shareExactLocation: boolean;
  showOnMap: boolean;
  locationHistory: boolean;
}

interface MapFiltersSheetProps {
  filters: FilterSettings;
  onFilterChange: (key: keyof FilterSettings, value: any) => void;
  locationPrivacy: LocationPrivacySettings;
  onPrivacyChange: (key: keyof LocationPrivacySettings) => void;
  userLocationEnabled: boolean;
  isUserLoggedIn: boolean;
  availableStates?: string[];
}

const MapFiltersSheet: React.FC<MapFiltersSheetProps> = ({ 
  filters,
  onFilterChange,
  locationPrivacy,
  onPrivacyChange,
  userLocationEnabled,
  isUserLoggedIn,
  availableStates = []
}) => {
  // Available skill levels
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
  const [locationSearch, setLocationSearch] = useState(filters.locationSearch || '');
  
  // Handle location search input
  const handleLocationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationSearch(e.target.value);
  };

  // Handle location search submission
  const handleLocationSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange('locationSearch', locationSearch);
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Map Settings & Filters</SheetTitle>
          <SheetDescription>
            Configure map display preferences and filters
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Following Filter - Make it prominent at the top for logged in users */}
          {isUserLoggedIn && (
            <>
              <div className="bg-accent/50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-following" className="flex items-center gap-2 font-medium">
                    <Heart className="h-5 w-5 text-red-500" />
                    Show Only People I Follow
                  </Label>
                  <Switch 
                    id="show-following" 
                    checked={filters.showFollowing || false}
                    onCheckedChange={(checked) => onFilterChange('showFollowing', checked)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Toggle this to see only the players and coaches you follow on the map
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Location Search */}
          <div>
            <h3 className="text-sm font-medium mb-3">Search Location</h3>
            <form onSubmit={handleLocationSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text"
                  placeholder="Search by city, address..."
                  className="pl-8"
                  value={locationSearch}
                  onChange={handleLocationSearchChange}
                />
              </div>
              <Button type="submit" size="sm">Search</Button>
            </form>
            <p className="text-xs text-muted-foreground mt-1">
              Search for courts and players in specific locations
            </p>
          </div>
          
          <Separator />
          
          {/* State Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Filter by State</h3>
            <Select
              value={filters.state || "any"}
              onValueChange={(value) => onFilterChange('state', value === "any" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any state</SelectItem>
                {availableStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Filter tennis courts by state
            </p>
          </div>
          
          <Separator />
          
          {/* Map Visibility Filters */}
          <div>
            <h3 className="text-sm font-medium mb-3">Map Visibility</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-courts" className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-primary" />
                  Show Tennis Courts
                </Label>
                <Switch 
                  id="show-courts" 
                  checked={filters.showCourts}
                  onCheckedChange={(checked) => onFilterChange('showCourts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-players" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Show Players
                </Label>
                <Switch 
                  id="show-players" 
                  checked={filters.showPlayers}
                  onCheckedChange={(checked) => onFilterChange('showPlayers', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-coaches" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-primary" />
                  Show Coaches
                </Label>
                <Switch 
                  id="show-coaches" 
                  checked={filters.showCoaches}
                  onCheckedChange={(checked) => onFilterChange('showCoaches', checked)}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Distance Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Distance</h3>
              <span className="text-sm text-muted-foreground">{filters.distance} miles</span>
            </div>
            
            <Slider
              defaultValue={[filters.distance]}
              min={1}
              max={100}
              step={1}
              value={[filters.distance]}
              onValueChange={(value) => onFilterChange('distance', value[0])}
              className="my-6"
            />
          </div>
          
          {/* Skill Level Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Player Skill Level</h3>
            <Select
              value={filters.skillLevel || "any"}
              onValueChange={(value) => onFilterChange('skillLevel', value === "any" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any skill level</SelectItem>
                {skillLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Filter players based on their skill level
            </p>
          </div>

          <Separator />
          
          {/* Location Privacy Settings */}
          {isUserLoggedIn && (
            <LocationPrivacyControl 
              locationPrivacy={locationPrivacy}
              onToggle={onPrivacyChange}
              userLocationEnabled={userLocationEnabled}
              isUserLoggedIn={isUserLoggedIn}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MapFiltersSheet;
