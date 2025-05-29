
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
    <div className="space-y-6">
      {/* Stats Overview for Coaches */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              unique students coached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachSessionsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              coaching sessions conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyCoachingSessions?.current || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              sessions this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyCoachingSessions?.current || 0}/{weeklyCoachingSessions?.goal || 10}
            </div>
            <div className="mt-2">
              <Progress value={weeklyCoachingSessions?.percentage || 0} className="h-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              weekly coaching target
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Coaches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Coach Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="h-auto p-4 justify-start">
              <Link to="/log-session">
                <div>
                  <div className="font-semibold">Log Coaching Session</div>
                  <div className="text-sm text-muted-foreground">Record a student training session</div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 justify-start">
              <Link to="/search">
                <div>
                  <div className="font-semibold">Find Students</div>
                  <div className="text-sm text-muted-foreground">Connect with new players</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Coaching Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Recent Coaching Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">
                        Session with {session.profiles?.full_name || session.profiles?.username || 'Student'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.focus_areas?.length > 0 
                          ? session.focus_areas.join(', ') 
                          : session.session_note 
                          ? session.session_note.substring(0, 50) + (session.session_note.length > 50 ? '...' : '')
                          : 'Coaching session'
                        }
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Date(session.session_date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No coaching sessions logged yet</p>
              <p className="text-sm">Start by logging your first coaching session!</p>
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
