
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { TennisCourt } from './TennisCourtsLayer';
import { Button } from '@/components/ui/button';

interface TennisCourtCardProps {
  court: TennisCourt;
  onViewOnMap: () => void;
}

const TennisCourtCard = ({ court, onViewOnMap }: TennisCourtCardProps) => {
  // Helper to format the address
  const formatAddress = () => {
    const parts = [];
    if (court.address) parts.push(court.address);
    if (court.city) parts.push(court.city);
    if (court.state) parts.push(court.state);
    if (court.country) parts.push(court.country);
    
    return parts.join(', ');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{court.name}</CardTitle>
          <Badge variant={court.is_public ? "default" : "outline"}>
            {court.is_public ? 'Public' : 'Private'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{formatAddress()}</span>
        </div>
      </CardHeader>
      <CardContent>
        {court.description && (
          <p className="text-sm mb-3">{court.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          {court.surface_type && (
            <Badge variant="secondary">
              {court.surface_type} courts
            </Badge>
          )}
          {court.distance !== undefined && (
            <Badge variant="outline">
              {court.distance.toFixed(1)} miles away
            </Badge>
          )}
        </div>
        
        <Button variant="outline" size="sm" className="w-full" onClick={onViewOnMap}>
          View on Map
        </Button>
      </CardContent>
    </Card>
  );
};

export default TennisCourtCard;
