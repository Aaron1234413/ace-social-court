import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter, Users, MapPin, User, CalendarClock, Tennis, Home } from 'lucide-react';
import LocationPrivacyControl from '@/components/map/LocationPrivacyControl';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface LocationPrivacySettings {
  shareExactLocation: boolean;
  showOnMap: boolean;
  locationHistory: boolean;
}

interface FilterSettings {
  showCourts: boolean;
  showPlayers: boolean;
  showCoaches: boolean;
  showEvents: boolean;
  showStaticLocations: boolean;
  showOwnLocation: boolean; // Added this filter
  distance: number; // in miles
}

interface MapFiltersSheetProps {
  filters: FilterSettings;
  onFilterChange: (key: keyof FilterSettings, value: any) => void;
  locationPrivacy: LocationPrivacySettings;
  onPrivacyChange: (key: keyof LocationPrivacySettings) => void;
  userLocationEnabled: boolean;
  isUserLoggedIn: boolean;
}

const MapFiltersSheet = ({
  filters,
  onFilterChange,
  locationPrivacy,
  onPrivacyChange,
  userLocationEnabled,
  isUserLoggedIn
}: MapFiltersSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-1">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Map Settings</SheetTitle>
        </SheetHeader>
        
        <div className="py-6">
          <h3 className="text-sm font-medium mb-4">Show on Map</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tennis className="h-4 w-4 text-green-500" />
                <Label htmlFor="show-courts">Tennis Courts</Label>
              </div>
              <Switch 
                id="show-courts" 
                checked={filters.showCourts} 
                onCheckedChange={(checked) => onFilterChange('showCourts', checked)} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <Label htmlFor="show-players">Players</Label>
              </div>
              <Switch 
                id="show-players" 
                checked={filters.showPlayers} 
                onCheckedChange={(checked) => onFilterChange('showPlayers', checked)} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <Label htmlFor="show-coaches">Coaches</Label>
              </div>
              <Switch 
                id="show-coaches" 
                checked={filters.showCoaches} 
                onCheckedChange={(checked) => onFilterChange('showCoaches', checked)} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-red-500" />
                <Label htmlFor="show-events">Events</Label>
              </div>
              <Switch 
                id="show-events" 
                checked={filters.showEvents} 
                onCheckedChange={(checked) => onFilterChange('showEvents', checked)} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Label htmlFor="show-static-locations">Home Locations</Label>
              </div>
              <Switch 
                id="show-static-locations" 
                checked={filters.showStaticLocations} 
                onCheckedChange={(checked) => onFilterChange('showStaticLocations', checked)} 
              />
            </div>

            {/* Add option for own location */}
            {isUserLoggedIn && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-cyan-600" />
                  <Label htmlFor="show-own-location">Your Profile Location</Label>
                </div>
                <Switch 
                  id="show-own-location" 
                  checked={filters.showOwnLocation} 
                  onCheckedChange={(checked) => onFilterChange('showOwnLocation', checked)} 
                />
              </div>
            )}
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="distance-filter">Search Distance: {filters.distance} miles</Label>
              <Slider
                id="distance-filter"
                min={1}
                max={100}
                step={1}
                value={[filters.distance]}
                onValueChange={(value) => onFilterChange('distance', value[0])}
                className="mt-2"
              />
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <h3 className="text-sm font-medium mb-4">Your Location Privacy</h3>
          <LocationPrivacyControl
            locationPrivacy={locationPrivacy}
            onToggle={onPrivacyChange}
            userLocationEnabled={userLocationEnabled}
            isUserLoggedIn={isUserLoggedIn}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MapFiltersSheet;
