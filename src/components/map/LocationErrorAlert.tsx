
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const LocationErrorAlert: React.FC = () => {
  const { locationError, shouldFallbackToAllCourts, showAllCourts } = useMapExplorer();
  
  if (!locationError) return null;
  
  return (
    <div className="mb-4">
      <Alert variant="destructive" className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-amber-800">
          {locationError}
          {!shouldFallbackToAllCourts && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={showAllCourts} 
              className="ml-2 text-xs"
            >
              Show All Courts
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default LocationErrorAlert;
