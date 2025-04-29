
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, MapPin, History } from 'lucide-react';

interface LocationPrivacySettings {
  shareExactLocation: boolean;
  showOnMap: boolean;
  locationHistory: boolean;
}

interface LocationPrivacyControlProps {
  locationPrivacy: LocationPrivacySettings;
  onToggle: (key: keyof LocationPrivacySettings) => void;
  userLocationEnabled: boolean;
  isUserLoggedIn: boolean;
}

const LocationPrivacyControl: React.FC<LocationPrivacyControlProps> = ({ 
  locationPrivacy, 
  onToggle,
  userLocationEnabled,
  isUserLoggedIn
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="show-on-map" className="text-sm">Show on map</Label>
        </div>
        <Switch 
          id="show-on-map" 
          checked={locationPrivacy.showOnMap} 
          onCheckedChange={() => onToggle('showOnMap')} 
        />
      </div>
      
      <div className="flex items-center justify-between space-x-2 pl-6">
        <Label 
          htmlFor="share-exact-location" 
          className={`text-sm ${!locationPrivacy.showOnMap ? 'text-muted-foreground' : ''}`}
        >
          Share exact location
        </Label>
        <Switch 
          id="share-exact-location" 
          checked={locationPrivacy.shareExactLocation} 
          disabled={!locationPrivacy.showOnMap}
          onCheckedChange={() => onToggle('shareExactLocation')} 
        />
      </div>
      
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="location-history" className="text-sm">Save location history</Label>
        </div>
        <Switch 
          id="location-history" 
          checked={locationPrivacy.locationHistory} 
          onCheckedChange={() => onToggle('locationHistory')} 
        />
      </div>
      
      <div className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
        <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>
          Your privacy is important. These settings control how your location is shared with other tennis players.
        </span>
      </div>
    </div>
  );
};

export default LocationPrivacyControl;
