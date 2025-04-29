
import React from 'react';
import { MapPin, MapPinCheck, Shield, Lock } from 'lucide-react';
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
}

const LocationStatusCard: React.FC<LocationStatusCardProps> = ({
  isLoggedIn,
  userLocationEnabled,
  locationPrivacy,
  userPosition,
  mapInstance
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
              <span>Your location is private and not visible to others</span>
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
