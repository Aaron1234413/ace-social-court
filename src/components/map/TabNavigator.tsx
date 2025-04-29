
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import { Toggle } from '@/components/ui/toggle';
import { Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const TabNavigator: React.FC = () => {
  const { activeTab, setActiveTab, filters, handleFilterChange, user } = useMapExplorer();
  
  return (
    <div className="border-b border-gray-200 flex flex-col">
      <div className="flex w-full">
        <button
          onClick={() => setActiveTab('people')}
          className={`px-3 py-2 flex-1 text-center font-medium text-sm ${
            activeTab === 'people' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground'
          }`}
        >
          People
        </button>
        <button
          onClick={() => setActiveTab('courts')}
          className={`px-3 py-2 flex-1 text-center font-medium text-sm ${
            activeTab === 'courts' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground'
          }`}
        >
          Courts
        </button>
      </div>
      
      {user && activeTab === 'people' && (
        <div className="flex items-center py-2 px-3 bg-muted/30 rounded-sm">
          <Checkbox 
            id="showFollowing" 
            checked={!!filters.showFollowing}
            onCheckedChange={(checked) => handleFilterChange('showFollowing', !!checked)} 
            className="mr-2 h-3.5 w-3.5"
          />
          <Label htmlFor="showFollowing" className="text-xs cursor-pointer flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Only show people I follow
          </Label>
        </div>
      )}
    </div>
  );
};

export default TabNavigator;
