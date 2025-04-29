
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import LocationPrivacyControl from "./LocationPrivacyControl";
import { useState } from "react";

interface MapFiltersSheetProps {
  filters: {
    showCourts: boolean;
    showPlayers: boolean;
    showCoaches: boolean;
    showEvents: boolean;
    showStaticLocations: boolean;
    distance: number;
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
}

const MapFiltersSheet: React.FC<MapFiltersSheetProps> = ({
  filters,
  onFilterChange,
  locationPrivacy,
  onPrivacyChange,
  userLocationEnabled,
  isUserLoggedIn
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleDistanceChange = (value: number[]) => {
    onFilterChange('distance', value[0]);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Map Filters</SheetTitle>
          <SheetDescription>
            Customize what appears on the map and set your location privacy preferences.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Show on Map</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-courts">Tennis Courts</Label>
              <Switch
                id="show-courts"
                checked={filters.showCourts}
                onCheckedChange={(value) => onFilterChange('showCourts', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-players">Players</Label>
              <Switch
                id="show-players"
                checked={filters.showPlayers}
                onCheckedChange={(value) => onFilterChange('showPlayers', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-coaches">Coaches</Label>
              <Switch
                id="show-coaches"
                checked={filters.showCoaches}
                onCheckedChange={(value) => onFilterChange('showCoaches', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-events">Events</Label>
              <Switch
                id="show-events"
                checked={filters.showEvents}
                onCheckedChange={(value) => onFilterChange('showEvents', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-static-locations">Home Locations</Label>
                <p className="text-xs text-muted-foreground">Show users' home locations even when they're not active</p>
              </div>
              <Switch
                id="show-static-locations"
                checked={filters.showStaticLocations}
                onCheckedChange={(value) => onFilterChange('showStaticLocations', value)}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Distance</h3>
              <p className="text-sm text-muted-foreground">Show results within {filters.distance} miles</p>
            </div>
            
            <Slider
              defaultValue={[filters.distance]}
              max={100}
              min={1}
              step={1}
              onValueChange={handleDistanceChange}
              className="mt-2"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 mile</span>
              <span>50 miles</span>
              <span>100 miles</span>
            </div>
          </div>
          
          <Separator />
          
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
