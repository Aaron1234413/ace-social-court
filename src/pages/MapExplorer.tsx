
import React, { useState, useEffect } from 'react';
import MapContainer from '@/components/map/MapContainer';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Users, 
  UserCog,
  Calendar,
  SlidersHorizontal,
  Loader2
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
import { toast } from 'sonner';

const MapExplorer = () => {
  const [filters, setFilters] = useState({
    showCourts: true,
    showPlayers: true,
    showCoaches: true,
    showEvents: true,
    distance: 25, // in miles
  });
  
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Ensure the component is fully mounted
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // Show toast for filter changes
    toast.info(`${key.replace('show', '')} ${filters[key] ? 'hidden' : 'shown'}`);
  };

  const setDistance = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      distance: value[0]
    }));
  };

  return (
    <div className="container py-4 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tennis Map</h1>
          <p className="text-muted-foreground">Find courts, players, and coaches near you</p>
        </div>
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
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {isReady ? (
        <MapContainer className="rounded-lg shadow-md" height="h-[60vh]" />
      ) : (
        <div className="rounded-lg shadow-md h-[60vh] flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Nearby Tennis Locations</h2>
        <p className="text-muted-foreground">
          Explore tennis courts and connect with players in your area. 
          Allow location access for the best experience.
        </p>
      </div>
    </div>
  );
};

export default MapExplorer;
