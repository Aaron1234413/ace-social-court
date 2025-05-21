
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import { MatchesList } from './MatchesList';
import { SessionsList } from './SessionsList';
import DashboardFilters from './DashboardFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

export type FilterState = {
  dateRange: 'all' | 'week' | 'month' | 'year';
  sortBy: 'newest' | 'oldest';
  searchQuery: string;
};

const DashboardContent = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("matches");
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    sortBy: 'newest',
    searchQuery: '',
  });
  
  const isCoach = profile?.user_type === 'coach';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your tennis progress and review your activities
          </p>
        </div>
        
        <DashboardFilters filters={filters} setFilters={setFilters} />
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="sessions">Training Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="matches" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Match History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MatchesList filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Training Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsList filters={filters} isCoach={isCoach} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardContent;
