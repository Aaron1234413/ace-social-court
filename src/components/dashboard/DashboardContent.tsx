
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
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activity History</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
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
        {/* Modern Pill-Style Tabs */}
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto md:mx-0 h-12 p-1 bg-gray-100 rounded-2xl shadow-inner">
          <TabsTrigger 
            value="matches" 
            className="rounded-xl h-10 font-semibold text-sm md:text-base transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:scale-[1.02]"
          >
            🏆 Matches
          </TabsTrigger>
          <TabsTrigger 
            value="sessions"
            className="rounded-xl h-10 font-semibold text-sm md:text-base transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:scale-[1.02]"
          >
            🎯 Training
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="matches" className="mt-6">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Filter className="h-5 w-5 text-green-600" />
                Match History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <MatchesList filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sessions" className="mt-6">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Filter className="h-5 w-5 text-blue-600" />
                Training Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <SessionsList filters={filters} isCoach={isCoach} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardContent;
