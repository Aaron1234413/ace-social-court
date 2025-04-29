
import React from 'react';
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { MapPin, Settings } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

interface MapFiltersSheetProps {
  filters: {
    showCourts: boolean;
    showPlayers: boolean;
    showCoaches: boolean;
    showEvents: boolean;
    showStaticLocations: boolean;
    showOwnLocation: boolean;
    showFollowing?: boolean; // Added for showing users being followed
    distance: number;
    state: string | null;
  };
  onFilterChange: (key: string, value: any) => void;
  locationPrivacy: {
    shareExactLocation: boolean;
    showOnMap: boolean;
    locationHistory: boolean;
  };
  onPrivacyChange: (key: string) => void;
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
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Map Filters</SheetTitle>
          <SheetDescription>
            Adjust map settings to find exactly what you're looking for.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Visibility</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="showCourts">Tennis Courts</Label>
              <Switch id="showCourts" checked={filters.showCourts} onCheckedChange={(checked) => onFilterChange('showCourts', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showPlayers">Players</Label>
              <Switch id="showPlayers" checked={filters.showPlayers} onCheckedChange={(checked) => onFilterChange('showPlayers', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showCoaches">Coaches</Label>
              <Switch id="showCoaches" checked={filters.showCoaches} onCheckedChange={(checked) => onFilterChange('showCoaches', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showStaticLocations">Static Locations</Label>
              <Switch id="showStaticLocations" checked={filters.showStaticLocations} onCheckedChange={(checked) => onFilterChange('showStaticLocations', checked)} />
            </div>
            {isUserLoggedIn && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showOwnLocation">My Profile Location</Label>
                  <Switch id="showOwnLocation" checked={filters.showOwnLocation} onCheckedChange={(checked) => onFilterChange('showOwnLocation', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showFollowing">Only People I Follow</Label>
                  <Switch 
                    id="showFollowing" 
                    checked={filters.showFollowing} 
                    onCheckedChange={(checked) => onFilterChange('showFollowing', checked)} 
                  />
                </div>
              </>
            )}
          </div>
          
          {/* State Filter */}
          {availableStates && availableStates.length > 0 && (
            <div className="space-y-2">
              <Label>State Filter</Label>
              <Select 
                value={filters.state || 'all'} 
                onValueChange={(value) => onFilterChange('state', value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {availableStates.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Distance (miles)</Label>
            <Slider
              defaultValue={[filters.distance]}
              max={100}
              step={1}
              onValueChange={(value) => onFilterChange('distance', value[0])}
            />
            <p className="text-sm text-muted-foreground">
              Current distance: {filters.distance} miles
            </p>
          </div>
          
          {isUserLoggedIn && (
            <div className="space-y-2">
              <h4 className="font-medium">Location Privacy</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="shareExactLocation">Share Exact Location</Label>
                <Switch 
                  id="shareExactLocation" 
                  checked={locationPrivacy.shareExactLocation} 
                  onCheckedChange={() => onPrivacyChange('shareExactLocation')} 
                  disabled={!userLocationEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showOnMap">Show on Map</Label>
                <Switch 
                  id="showOnMap" 
                  checked={locationPrivacy.showOnMap} 
                  onCheckedChange={() => onPrivacyChange('showOnMap')}
                  disabled={!userLocationEnabled}
                />
              </div>
              {!userLocationEnabled && (
                <p className="text-sm text-muted-foreground">
                  <MapPin className="inline-block h-3 w-3 mr-1" />
                  Location services are disabled. Please enable them to share your location.
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MapFiltersSheet;
