
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StudentFiltersProps {
  activeFilter: 'all' | 'active' | 'plateau' | 'at-risk';
  onFilterChange: (filter: 'all' | 'active' | 'plateau' | 'at-risk') => void;
  studentCounts: {
    all: number;
    active: number;
    plateau: number;
    'at-risk': number;
  };
}

export function StudentFilters({ activeFilter, onFilterChange, studentCounts }: StudentFiltersProps) {
  const filters = [
    { key: 'all' as const, label: 'All', count: studentCounts.all },
    { key: 'active' as const, label: 'Active', count: studentCounts.active },
    { key: 'plateau' as const, label: 'Plateau', count: studentCounts.plateau },
    { key: 'at-risk' as const, label: 'At Risk', count: studentCounts['at-risk'] }
  ];

  const getFilterStyle = (filterKey: string) => {
    const isActive = activeFilter === filterKey;
    
    switch (filterKey) {
      case 'active':
        return isActive 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'hover:bg-green-50 hover:text-green-700';
      case 'plateau':
        return isActive 
          ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
          : 'hover:bg-yellow-50 hover:text-yellow-700';
      case 'at-risk':
        return isActive 
          ? 'bg-red-100 text-red-800 border-red-200' 
          : 'hover:bg-red-50 hover:text-red-700';
      default:
        return isActive 
          ? 'bg-blue-100 text-blue-800 border-blue-200' 
          : 'hover:bg-blue-50 hover:text-blue-700';
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant={activeFilter === filter.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className={`flex items-center gap-2 h-8 ${getFilterStyle(filter.key)}`}
        >
          <span className="text-xs font-medium">{filter.label}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
            {filter.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}
