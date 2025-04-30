
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings, MapPin, Users, UserCog, Map, CircleSlash, Heart } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import LocationPrivacyControl from "./LocationPrivacyControl";
import { useMapExplorer } from "@/contexts/MapExplorerContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MapFiltersSheet = () => {
  const { 
    user, 
    filters, 
    handleFilterChange, 
    locationPrivacy, 
    togglePrivacySetting,
    userLocationEnabled,
    showAllCourts
  } = useMapExplorer();

  // Available skill levels
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
  
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
                  onCheckedChange={(checked) => handleFilterChange('showCourts', checked)}
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
                  onCheckedChange={(checked) => handleFilterChange('showPlayers', checked)}
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
                  onCheckedChange={(checked) => handleFilterChange('showCoaches', checked)}
                />
              </div>

              {user && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-following" className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Only Show People I Follow
                  </Label>
                  <Switch 
                    id="show-following" 
                    checked={filters.showFollowing}
                    onCheckedChange={(checked) => handleFilterChange('showFollowing', checked)}
                  />
                </div>
              )}
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
              onValueChange={(value) => handleFilterChange('distance', value[0])}
              className="my-6"
            />
          </div>
          
          {/* Skill Level Filter */}
          <div>
            <h3 className="text-sm font-medium mb-3">Player Skill Level</h3>
            <Select
              value={filters.skillLevel || ""}
              onValueChange={(value) => handleFilterChange('skillLevel', value || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any skill level</SelectItem>
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
          {user && (
            <LocationPrivacyControl 
              locationPrivacy={locationPrivacy}
              onToggle={togglePrivacySetting}
              userLocationEnabled={userLocationEnabled}
              isUserLoggedIn={!!user}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MapFiltersSheet;
