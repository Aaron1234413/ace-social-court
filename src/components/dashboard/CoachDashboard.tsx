
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Plus,
  BarChart2,
  Award,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import DashboardContent from './DashboardContent';

const CoachDashboard = () => {
  const { user } = useAuth();

  // Real sessions where this coach was involved
  const { data: coachSessionsCount } = useQuery({
    queryKey: ['coach-dashboard-sessions-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id);
      
      if (error) {
        console.error('Error fetching coach sessions count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user?.id
  });

  // Count unique students this coach has worked with
  const { data: studentsCount } = useQuery({
    queryKey: ['coach-dashboard-students-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('coach_id', user.id);
      
      if (error) {
        console.error('Error fetching coach students:', error);
        return 0;
      }
      
      // Get unique student IDs
      const uniqueStudents = [...new Set(data?.map(session => session.user_id) || [])];
      return uniqueStudents.length;
    },
    enabled: !!user?.id
  });

  // Get this week's coaching sessions
  const { data: weeklyCoachingSessions } = useQuery({
    queryKey: ['coach-dashboard-weekly-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return { current: 0, goal: 10, percentage: 0 };
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const { data, error } = await supabase
        .from('sessions')
        .select('session_date')
        .eq('coach_id', user.id)
        .gte('session_date', startOfWeek.toISOString().split('T')[0])
        .lt('session_date', endOfWeek.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching weekly coaching sessions:', error);
        return { current: 0, goal: 10, percentage: 0 };
      }

      const sessionsThisWeek = data?.length || 0;
      const weeklyGoal = 10; // Default goal for coaches
      const percentage = Math.min((sessionsThisWeek / weeklyGoal) * 100, 100);

      return {
        current: sessionsThisWeek,
        goal: weeklyGoal,
        percentage
      };
    },
    enabled: !!user?.id
  });

  // Get recent coaching sessions
  const { data: recentSessions } = useQuery({
    queryKey: ['coach-dashboard-recent-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          session_date,
          focus_areas,
          session_note,
          user_id,
          profiles!sessions_user_id_fkey(username, full_name)
        `)
        .eq('coach_id', user.id)
        .order('session_date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent coaching sessions:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id
  });

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Mobile-optimized Stats Overview for Coaches */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Students</CardTitle>
            <Users className="h-5 w-5 md:h-4 md:w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">{studentsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              unique students coached
            </p>
          </CardContent>
        </Card>

        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Sessions</CardTitle>
            <Target className="h-5 w-5 md:h-4 md:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">{coachSessionsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              coaching sessions conducted
            </p>
          </CardContent>
        </Card>

        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-5 w-5 md:h-4 md:w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">
              {weeklyCoachingSessions?.current || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              sessions this week
            </p>
          </CardContent>
        </Card>

        <Card className="touch-manipulation">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Weekly Goal</CardTitle>
            <TrendingUp className="h-5 w-5 md:h-4 md:w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">
              {weeklyCoachingSessions?.current || 0}/{weeklyCoachingSessions?.goal || 10}
            </div>
            <div className="mt-2">
              <Progress value={weeklyCoachingSessions?.percentage || 0} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              weekly coaching target
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-optimized Quick Actions for Coaches */}
      <Card className="touch-manipulation">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Plus className="h-5 w-5" />
            Coach Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 md:pb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <Button asChild className="h-16 md:h-auto p-4 justify-start text-left touch-manipulation">
              <Link to="/log-session">
                <div className="flex items-center gap-3 w-full">
                  <Target className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm md:text-base">Log Coaching Session</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Record a student training session</div>
                  </div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 md:h-auto p-4 justify-start text-left touch-manipulation">
              <Link to="/search">
                <div className="flex items-center gap-3 w-full">
                  <Users className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm md:text-base">Find Students</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Connect with new players</div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-optimized Recent Coaching Sessions */}
      <Card className="touch-manipulation">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <BarChart2 className="h-5 w-5" />
            Recent Coaching Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 md:pb-6">
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 md:p-3 border rounded-lg touch-manipulation">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm md:text-base">
                        Session with {Array.isArray(session.profiles) && session.profiles.length > 0 
                          ? session.profiles[0]?.full_name || session.profiles[0]?.username || 'Student'
                          : 'Student'}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground truncate">
                        {session.focus_areas?.length > 0 
                          ? session.focus_areas.join(', ') 
                          : session.session_note 
                          ? session.session_note.substring(0, 50) + (session.session_note.length > 50 ? '...' : '')
                          : 'Coaching session'
                        }
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                    {new Date(session.session_date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm md:text-base">No coaching sessions logged yet</p>
              <p className="text-xs md:text-sm">Start by logging your first coaching session!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Activity List */}
      <DashboardContent />
    </div>
  );
};

export default CoachDashboard;
