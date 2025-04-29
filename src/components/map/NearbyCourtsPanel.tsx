
import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { TennisCourt } from './TennisCourtsLayer';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NearbyCourtsListProps {
  courts: TennisCourt[];
  isLoading: boolean;
  onCourtSelect: (court: TennisCourt) => void;
  onRetry?: () => void;
}

const NearbyCourtsPanel = ({ courts, isLoading, onCourtSelect, onRetry }: NearbyCourtsListProps) => {
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [surfaceFilter, setSurfaceFilter] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Get unique surface types
  const surfaceTypes = Array.from(new Set(courts.map(court => court.surface_type).filter(Boolean)));
  
  // Apply filters
  const filteredCourts = courts.filter(court => {
    if (filter === 'public' && !court.is_public) return false;
    if (filter === 'private' && court.is_public) return false;
    if (surfaceFilter && court.surface_type !== surfaceFilter) return false;
    return true;
  });

  // Set a timeout to show an error message if loading takes too long
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
    } else {
      setLoadingTimeout(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);
  
  const formatDistance = (distance: number) => {
    if (distance < 0.1) return 'Less than 0.1 mi';
    return `${distance.toFixed(1)} mi`;
  };
  
  return (
    <div className="bg-background rounded-lg border shadow-sm p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Nearby Tennis Courts</h3>
        <div className="flex gap-2">
          <Badge 
            variant={filter === 'all' ? "default" : "outline"}
            onClick={() => setFilter('all')}
            className="cursor-pointer"
          >
            All
          </Badge>
          <Badge 
            variant={filter === 'public' ? "default" : "outline"}
            onClick={() => setFilter('public')}
            className="cursor-pointer"
          >
            Public
          </Badge>
          <Badge 
            variant={filter === 'private' ? "default" : "outline"}
            onClick={() => setFilter('private')}
            className="cursor-pointer"
          >
            Private
          </Badge>
        </div>
      </div>
      
      {surfaceTypes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge 
            variant={surfaceFilter === null ? "secondary" : "outline"}
            onClick={() => setSurfaceFilter(null)}
            className="cursor-pointer"
          >
            All Surfaces
          </Badge>
          
          {surfaceTypes.map(surface => (
            <Badge 
              key={surface}
              variant={surfaceFilter === surface ? "secondary" : "outline"}
              onClick={() => setSurfaceFilter(surface === surfaceFilter ? null : surface)}
              className="cursor-pointer"
            >
              {surface}
            </Badge>
          ))}
        </div>
      )}
      
      <Separator className="mb-3" />
      
      <ScrollArea className="h-[240px] pr-3">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Finding nearby tennis courts...
            
            {loadingTimeout && (
              <div className="mt-4">
                <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-amber-800">
                    Taking longer than expected. Location services may be disabled.
                  </AlertDescription>
                </Alert>
                
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRetry} 
                    className="mt-2 w-full flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" /> Try Again
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : filteredCourts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {courts.length === 0 
              ? "No tennis courts found nearby" 
              : "No courts match your filters"
            }
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCourts.map(court => (
              <div 
                key={court.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onCourtSelect(court)}
              >
                <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="4" width="6" height="16" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{court.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={court.is_public ? "default" : "secondary"} className="text-xs">
                      {court.is_public ? 'Public' : 'Private'}
                    </Badge>
                    {court.distance !== undefined && (
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {formatDistance(court.distance)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NearbyCourtsPanel;
