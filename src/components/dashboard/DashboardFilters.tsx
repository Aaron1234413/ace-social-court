
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterState } from './DashboardContent';

interface DashboardFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ filters, setFilters }) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };
  
  const handleDateRangeChange = (value: string) => {
    setFilters(prev => ({ ...prev, dateRange: value as FilterState['dateRange'] }));
  };
  
  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value as FilterState['sortBy'] }));
  };
  
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Input
        placeholder="Search..."
        className="max-w-[300px]"
        value={filters.searchQuery}
        onChange={handleSearchChange}
      />
      
      <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="week">This week</SelectItem>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="year">This year</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={filters.sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DashboardFilters;
