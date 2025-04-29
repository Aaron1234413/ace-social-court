
import React from 'react';
import { MapPin, MapPinCheck, Shield, Lock, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LocationStatusCardProps {
  isLoggedIn: boolean;
  userLocationEnabled: boolean;
  locationPrivacy: {
    showOnMap: boolean;
    shareExactLocation: boolean;
  };
  userPosition: { lng: number; lat: number } | null;
  mapInstance: mapboxgl.Map | null;
  profileLocation?: any; // Added
  onViewProfileLocation?: () => void; // Added
}

const LocationStatusCard: React.FC<LocationStatusCardProps> = ({
  isLoggedIn,
  userLocationEnabled,
  locationPrivacy,
  userPosition,
  mapInstance,
  profileLocation,
  onViewProfileLocation
}) => {
  const handleFindLocation = () => {
    if (mapInstance && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: 14
          });
          toast.success("Location found");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not find your location");
        }
      );
    } else {
      toast.info("Finding your location...");
    }
  };

  const hasProfileLocation = !!profileLocation?.location_name;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Your Location Status</h3>
      {isLoggedIn ? (
        userLocationEnabled && locationPrivacy.showOnMap ? (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <MapPinCheck className="h-4 w-4" />
              <span>
                Your {locationPrivacy.shareExactLocation ? 'exact' : 'approximate'} location is visible to other tennis players
              </span>
            </div>
          </div>
        ) : (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Shield className="h-4 w-4" />
              <span>Your live location is private and not visible to others</span>
            </div>
          </div>
        )
      ) : (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Lock className="h-4 w-4" />
            <span>Sign in to share your location with other players</span>
          </div>
        </div>
      )}
      
      {/* Show profile location if available */}
      {hasProfileLocation && isLoggedIn && (
        <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-gray-600" />
              <div>
                <span className="text-gray-600">Profile location:</span>
                <div className="font-medium truncate max-w-[180px]">{profileLocation.location_name}</div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={onViewProfileLocation}
            >
              View
            </Button>
          </div>
        </div>
      )}
      
      {!userPosition && userLocationEnabled && (
        <Button
          className="mt-3 w-full"
          size="sm"
          onClick={handleFindLocation}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Find my location
        </Button>
      )}
    </Card>
  );
};

export default LocationStatusCard;
