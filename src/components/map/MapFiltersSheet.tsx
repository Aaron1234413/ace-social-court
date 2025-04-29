
import React from 'react';
import { 
  MapPin, 
  Users, 
  UserCog,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import LocationPrivacyControl from '@/components/map/LocationPrivacyControl';
import { toast } from 'sonner';

interface FilterSettings {
  showCourts: boolean;
  showPlayers: boolean;
  showCoaches: boolean;
  showEvents: boolean;
  distance: number;
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
}

const MapFiltersSheet = ({ 
  filters, 
  onFilterChange, 
  locationPrivacy, 
  onPrivacyChange,
  userLocationEnabled,
  isUserLoggedIn
}: MapFiltersSheetProps) => {
  
  const toggleFilter = (key: keyof FilterSettings) => {
    onFilterChange(key, !filters[key]);
    toast.info(`${key.replace('show', '')} ${filters[key] ? 'hidden' : 'shown'}`);
  };

  const setDistance = (value: number[]) => {
    onFilterChange('distance', value[0]);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Map Filters</SheetTitle>
          <SheetDescription>
            Control what you see on the tennis map.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Location Types</h3>
            <div className="flex flex-wrap gap-2">
              <Toggle 
                pressed={filters.showCourts} 
                onPressedChange={() => toggleFilter('showCourts')}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" /> Courts
              </Toggle>
              <Toggle 
                pressed={filters.showPlayers} 
                onPressedChange={() => toggleFilter('showPlayers')}
                className="gap-2"
              >
                <Users className="h-4 w-4" /> Players
              </Toggle>
              <Toggle 
                pressed={filters.showCoaches} 
                onPressedChange={() => toggleFilter('showCoaches')}
                className="gap-2"
              >
                <UserCog className="h-4 w-4" /> Coaches
              </Toggle>
              <Toggle 
                pressed={filters.showEvents} 
                onPressedChange={() => toggleFilter('showEvents')}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" /> Events
              </Toggle>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Distance</h3>
              <div className="px-2">
                <Slider 
                  defaultValue={[filters.distance]} 
                  max={100} 
                  step={5} 
                  onValueChange={setDistance}
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0 mi</span>
                  <span>{filters.distance} mi</span>
                  <span>100 mi</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <LocationPrivacySection 
              privacy={locationPrivacy}
              onPrivacyChange={onPrivacyChange}
              userLocationEnabled={userLocationEnabled}
              isUserLoggedIn={isUserLoggedIn}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Internal component for the location privacy section
const LocationPrivacySection = ({ 
  privacy, 
  onPrivacyChange, 
  userLocationEnabled, 
  isUserLoggedIn 
}: { 
  privacy: LocationPrivacySettings, 
  onPrivacyChange: (key: keyof LocationPrivacySettings) => void,
  userLocationEnabled: boolean,
  isUserLoggedIn: boolean
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Location Settings</h3>
        {!isUserLoggedIn && <Lock className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      <p className="text-xs text-muted-foreground mb-3">
        {!isUserLoggedIn
          ? "Sign in to share your location"
          : userLocationEnabled 
            ? "Location access is enabled" 
            : "Enable location access for better results"}
      </p>
      
      {userLocationEnabled && isUserLoggedIn ? (
        <LocationPrivacyControl 
          settings={privacy} 
          onChange={onPrivacyChange} 
        />
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <Shield className="h-4 w-4" />
          <span>
            {!isUserLoggedIn
              ? "Sign in to share your location"
              : "Location services are disabled"}
          </span>
        </div>
      )}
    </div>
  );
};

// Import missing components for LocationPrivacySection
import { Lock, Shield } from 'lucide-react';

export default MapFiltersSheet;
