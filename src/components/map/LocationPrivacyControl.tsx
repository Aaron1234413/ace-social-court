
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapPin, CircleSlash, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface LocationPrivacyControlProps {
  locationPrivacy: {
    shareExactLocation: boolean;
    showOnMap: boolean;
    locationHistory: boolean;
  };
  onToggle: (key: 'shareExactLocation' | 'showOnMap' | 'locationHistory') => void;
  userLocationEnabled: boolean;
  isUserLoggedIn: boolean;
}

const LocationPrivacyControl: React.FC<LocationPrivacyControlProps> = ({ 
  locationPrivacy, 
  onToggle,
  userLocationEnabled,
  isUserLoggedIn
}) => {
  if (!isUserLoggedIn) return null;
  
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-medium">Location Privacy</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-on-map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Show Me On Map
            </Label>
            <Switch 
              id="show-on-map" 
              disabled={!userLocationEnabled}
              checked={locationPrivacy.showOnMap}
              onCheckedChange={() => onToggle('showOnMap')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="share-exact-location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Share Exact Location
            </Label>
            <Switch 
              id="share-exact-location" 
              disabled={!locationPrivacy.showOnMap || !userLocationEnabled}
              checked={locationPrivacy.shareExactLocation}
              onCheckedChange={() => onToggle('shareExactLocation')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="location-history" className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Store Location History
            </Label>
            <Switch 
              id="location-history" 
              disabled={!locationPrivacy.showOnMap || !userLocationEnabled}
              checked={locationPrivacy.locationHistory}
              onCheckedChange={() => onToggle('locationHistory')}
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {!userLocationEnabled ? 
            "Enable location services to update these settings." : 
            "Control how your location is shared with other users."}
        </p>
      </CardContent>
    </Card>
  );
};

export default LocationPrivacyControl;
