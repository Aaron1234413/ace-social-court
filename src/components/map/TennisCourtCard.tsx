
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
  
  // Determine card background based on surface type
  const getCardBackground = () => {
    if (!court.surface_type) return "tennis-card";
    
    const surfaceType = court.surface_type.toLowerCase();
    if (surfaceType.includes('clay')) {
      return "bg-gradient-to-br from-card to-orange-50";
    } else if (surfaceType.includes('grass')) {
      return "bg-gradient-to-br from-card to-emerald-50";
    } else if (surfaceType.includes('hard')) {
      return "bg-gradient-to-br from-card to-blue-50";
    } else {
      return "tennis-card";
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow duration-300 ${getCardBackground()}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-balance">{court.name}</CardTitle>
          <Badge 
            variant={court.is_public ? "default" : "outline"}
            className={court.is_public ? "bg-tennis-green text-white" : ""}
          >
            {court.is_public ? 'Public' : 'Private'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span className="text-balance">{formatAddress()}</span>
        </div>
      </CardHeader>
      <CardContent>
        {court.description && (
          <p className="text-sm mb-3 text-balance">{court.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          {court.surface_type && (
            <Badge variant="secondary" className="animate-slide-up">
              {court.surface_type} courts
            </Badge>
          )}
          {court.distance !== undefined && (
            <Badge variant="outline" className="animate-slide-up delay-100">
              {court.distance.toFixed(1)} miles away
            </Badge>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full group hover:border-tennis-green hover:text-tennis-green transition-colors" 
          onClick={onViewOnMap}
        >
          <span>View on Map</span>
          <MapPin className="ml-1 h-4 w-4 group-hover:animate-bounce-subtle" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default TennisCourtCard;
