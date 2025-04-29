
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import { Toggle } from '@/components/ui/toggle';
import { Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const TabNavigator: React.FC = () => {
  const { activeTab, setActiveTab, filters, handleFilterChange, user } = useMapExplorer();
  
  return (
    <div className="border-b border-gray-200 flex flex-col mb-4">
      <div className="flex">
        <button
          onClick={() => setActiveTab('people')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'people' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground'
          }`}
        >
          People
        </button>
        <button
          onClick={() => setActiveTab('courts')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'courts' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground'
          }`}
        >
          Courts
        </button>
      </div>
      
      {user && activeTab === 'people' && (
        <div className="flex items-center space-x-2 px-4 py-1 text-sm">
          <Checkbox 
            id="showFollowing" 
            checked={!!filters.showFollowing}
            onCheckedChange={(checked) => handleFilterChange('showFollowing', !!checked)} 
          />
          <Label htmlFor="showFollowing" className="text-sm cursor-pointer">
            <Users className="h-3 w-3 inline mr-1" />
            Only show people I follow
          </Label>
        </div>
      )}
    </div>
  );
};

export default TabNavigator;
