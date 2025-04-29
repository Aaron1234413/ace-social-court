
import React from 'react';
import { useMapExplorer } from '@/contexts/MapExplorerContext';

const TabNavigator: React.FC = () => {
  const { activeTab, setActiveTab } = useMapExplorer();
  
  return (
    <div className="border-b border-gray-200 flex mb-4">
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
  );
};

export default TabNavigator;
