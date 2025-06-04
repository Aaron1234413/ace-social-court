import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp, 
  Users,
  Award,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  BookOpen,
  Star,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard';
import { toast } from 'sonner';
import { PriorityStudents } from './coach/PriorityStudents';
import { RecentActiveStudents } from './coach/RecentActiveStudents';
import { SmartAlerts } from './coach/SmartAlerts';

const CoachDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("lessons");
  
  // Set up real-time subscriptions
  useRealtimeDashboard();

  // Handle starring/unstarring students
  const handleToggleStar = async (studentId: string) => {
    // For now, just show a toast since we're using local state
    toast.success('Student priority updated');
  };

  // Real todays lessons from database
  const { data: todaysLessons } = useQuery({
    queryKey: ['coach-todays-lessons', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          profiles!sessions_user_id_fkey (
            username,
            full_name
          )
        `)
        .eq('coach_id', user.id)
        .eq('session_date', today)
        .order('session_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching todays lessons:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.id
  });

  // Real sessions count from database
  const { data: totalSessionsCoached } = useQuery({
    queryKey: ['coach-dashboard-sessions-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id);
      
      if (error) {
        console.error('Error fetching sessions count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user?.id
  });

  // Mock coach ranking
  const coachRanking = Math.floor(Math.random() * 100) + 1;

  return (
    <div className="space-y-4 md:space-y-6 px-3 md:px-4 lg:px-0">
      {/* Coach Header */}
      <div className="text-center py-6 md:py-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl mx-1 md:mx-0">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-white rounded-full shadow-lg">
            <UserCheck className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-800">Coach Dashboard</div>
            <div className="text-sm md:text-base text-blue-600">Manage your lessons and students</div>
          </div>
        </div>
      </div>

      {/* Modern Pill-Style Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto h-12 md:h-14 p-1 bg-gray-100 rounded-2xl shadow-inner">
          <TabsTrigger 
            value="lessons" 
            className="rounded-xl h-10 md:h-12 font-semibold text-xs md:text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:scale-[1.02] px-2 md:px-4"
          >
            <Calendar className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Today's</span> Lessons
          </TabsTrigger>
          <TabsTrigger 
            value="activity"
            className="rounded-xl h-10 md:h-12 font-semibold text-xs md:text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:scale-[1.02] px-2 md:px-4"
          >
            <Users className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Student</span> Activity
          </TabsTrigger>
          <TabsTrigger 
            value="alerts"
            className="rounded-xl h-10 md:h-12 font-semibold text-xs md:text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:scale-[1.02] px-2 md:px-4"
          >
            <Bell className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Smart</span> Alerts
          </TabsTrigger>
          <TabsTrigger 
            value="growth"
            className="rounded-xl h-10 md:h-12 font-semibold text-xs md:text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary data-[state=active]:scale-[1.02] px-2 md:px-4"
          >
            <Award className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Growth</span> Hub
          </TabsTrigger>
        </TabsList>

        {/* Today's Lessons Tab */}
        <TabsContent value="lessons" className="mt-6">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Calendar className="h-5 w-5 text-blue-600" />
                Today's Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {todaysLessons && todaysLessons.length > 0 ? (
                <div className="space-y-4">
                  {todaysLessons.map((lesson) => {
                    const profile = lesson.profiles?.[0];
                    return (
                      <div key={lesson.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm space-y-3 md:space-y-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-base text-gray-900">
                              {profile?.username || profile?.full_name || 'Unknown Player'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(lesson.session_date).toLocaleTimeString()} • {lesson.location || 'No location set'}
                            </div>
                            {lesson.focus_areas && lesson.focus_areas.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {lesson.focus_areas.slice(0, 2).map((area, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            variant={lesson.status === 'Logged' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1 md:flex-none"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                          <Button
                            variant={lesson.status === 'Signed Off' ? 'destructive' : 'outline'}
                            size="sm"
                            className="flex-1 md:flex-none"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p className="text-base font-medium">No lessons scheduled for today</p>
                  <p className="text-sm mt-1">Your upcoming lessons will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Students - 1/3 width on large screens */}
            <div className="lg:col-span-1">
              <PriorityStudents />
            </div>
            
            {/* Recent Active Students - 2/3 width on large screens */}
            <div className="lg:col-span-2">
              <RecentActiveStudents onToggleStar={handleToggleStar} />
            </div>
          </div>
        </TabsContent>

        {/* Smart Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <SmartAlerts />
        </TabsContent>

        {/* Growth Hub Tab */}
        <TabsContent value="growth" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Total Sessions Coached */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-100">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-purple-600" />
                  Sessions Coached
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold text-purple-800">{totalSessionsCoached || 0}</div>
                <p className="text-sm text-purple-600 mt-1">Total sessions completed</p>
              </CardContent>
            </Card>

            {/* Leaderboard Ranking */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-orange-100">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold text-yellow-800">#{coachRanking || '?'}</div>
                <p className="text-sm text-yellow-600 mt-1">Coach leaderboard</p>
              </CardContent>
            </Card>

            {/* Recent Milestones */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-100 md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-green-600" />
                  Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getMilestones(totalSessionsCoached || 0).map((milestone, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl">{milestone.icon}</div>
                      <div>
                        <div className="font-semibold text-sm text-green-800">{milestone.title}</div>
                        <div className="text-xs text-green-600">{milestone.description}</div>
                      </div>
                    </div>
                  ))}
                  {getMilestones(totalSessionsCoached || 0).length === 0 && (
                    <div className="text-center py-4 text-green-600">
                      <Award className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Complete sessions to earn milestones!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to get milestones
const getMilestones = (sessionCount: number) => {
  const milestones = [];
  
  if (sessionCount >= 10) {
    milestones.push({
      icon: "🏆",
      title: "First Milestone",
      description: "10 Sessions Coached"
    });
  }
  
  if (sessionCount >= 50) {
    milestones.push({
      icon: "🎯",
      title: "Coach Professional",
      description: "50 Sessions Coached"
    });
  }
  
  if (sessionCount >= 100) {
    milestones.push({
      icon: "🎖",
      title: "Master Coach",
      description: "100 Sessions Coached"
    });
  }
  
  if (sessionCount >= 250) {
    milestones.push({
      icon: "👑",
      title: "Elite Coach",
      description: "250 Sessions Coached"
    });
  }
  
  return milestones.slice(-3); // Show last 3 milestones
};

export default CoachDashboard;
