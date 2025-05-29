
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp, 
  Plus,
  BarChart2,
  Flame,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import DashboardContent from './DashboardContent';

const PlayerDashboard = () => {
  const { user } = useAuth();

  // Real matches count from database
  const { data: matchesCount } = useQuery({
    queryKey: ['dashboard-matches-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching matches count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user?.id
  });

  // Real sessions count from database
  const { data: sessionsCount } = useQuery({
    queryKey: ['dashboard-sessions-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching sessions count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user?.id
  });

  // Calculate real streak from actual session/match data
  const { data: currentStreak } = useQuery({
    queryKey: ['dashboard-current-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // Get all sessions and matches for the user, ordered by date descending
      const [sessionsResult, matchesResult] = await Promise.all([
        supabase
          .from('sessions')
          .select('session_date')
          .eq('user_id', user.id)
          .order('session_date', { ascending: false }),
        supabase
          .from('matches')
          .select('match_date')
          .eq('user_id', user.id)
          .order('match_date', { ascending: false })
      ]);

      if (sessionsResult.error || matchesResult.error) {
        console.error('Error fetching activity data for streak');
        return 0;
      }

      // Combine and sort all activity dates
      const allActivities = [
        ...(sessionsResult.data || []).map(s => new Date(s.session_date)),
        ...(matchesResult.data || []).map(m => new Date(m.match_date))
      ].sort((a, b) => b.getTime() - a.getTime());

      if (allActivities.length === 0) return 0;

      // Calculate streak - consecutive days with activity
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if there's activity today or yesterday (to account for timezone differences)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let checkDate = today;
      let lastActivityDate = allActivities[0];
      lastActivityDate.setHours(0, 0, 0, 0);

      // If the most recent activity is today or yesterday, start counting
      if (lastActivityDate.getTime() === today.getTime() || lastActivityDate.getTime() === yesterday.getTime()) {
        checkDate = lastActivityDate;
        streak = 1;

        // Look for consecutive days
        for (let i = 1; i < allActivities.length; i++) {
          const activityDate = new Date(allActivities[i]);
          activityDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(checkDate);
          expectedDate.setDate(expectedDate.getDate() - 1);

          if (activityDate.getTime() === expectedDate.getTime()) {
            streak++;
            checkDate = activityDate;
          } else if (activityDate.getTime() < expectedDate.getTime()) {
            // Gap found, break the streak
            break;
          }
        }
      }

      return streak;
    },
    enabled: !!user?.id
  });

  // Calculate weekly progress from real session data
  const { data: weeklyProgress } = useQuery({
    queryKey: ['dashboard-weekly-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return { current: 0, goal: 5, percentage: 0 };
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const { data, error } = await supabase
        .from('sessions')
        .select('session_date')
        .eq('user_id', user.id)
        .gte('session_date', startOfWeek.toISOString().split('T')[0])
        .lt('session_date', endOfWeek.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching weekly sessions:', error);
        return { current: 0, goal: 5, percentage: 0 };
      }

      const sessionsThisWeek = data?.length || 0;
      const weeklyGoal = 5; // Default goal, could be user-configurable later
      const percentage = Math.min((sessionsThisWeek / weeklyGoal) * 100, 100);

      return {
        current: sessionsThisWeek,
        goal: weeklyGoal,
        percentage
      };
    },
    enabled: !!user?.id
  });

  // Get recent activity for "upcoming activities" section (no real upcoming data, so show recent)
  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard-recent-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get recent sessions and matches
      const [recentSessions, recentMatches] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, session_date, focus_areas')
          .eq('user_id', user.id)
          .order('session_date', { ascending: false })
          .limit(3),
        supabase
          .from('matches')
          .select('id, match_date, score, location')
          .eq('user_id', user.id)
          .order('match_date', { ascending: false })
          .limit(3)
      ]);

      const activities = [];
      
      // Add recent sessions
      if (recentSessions.data) {
        recentSessions.data.forEach(session => {
          activities.push({
            type: 'session',
            date: session.session_date,
            title: `Training Session`,
            description: session.focus_areas?.length > 0 ? session.focus_areas.join(', ') : 'General training'
          });
        });
      }

      // Add recent matches
      if (recentMatches.data) {
        recentMatches.data.forEach(match => {
          activities.push({
            type: 'match',
            date: match.match_date,
            title: `Match`,
            description: match.location || match.score || 'Tennis match'
          });
        });
      }

      // Sort by date and return most recent
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
    },
    enabled: !!user?.id
  });

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground">
              {currentStreak && currentStreak > 0 ? "days active" : "Start logging!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              training sessions logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchesCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              matches played
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyProgress?.current || 0}/{weeklyProgress?.goal || 5}
            </div>
            <div className="mt-2">
              <Progress value={weeklyProgress?.percentage || 0} className="h-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              sessions this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="h-auto p-4 justify-start">
              <Link to="/log-session">
                <div>
                  <div className="font-semibold">Log Training Session</div>
                  <div className="text-sm text-muted-foreground">Record your practice session</div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 justify-start">
              <Link to="/log-match">
                <div>
                  <div className="font-semibold">Log Match</div>
                  <div className="text-sm text-muted-foreground">Record your match results</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {activity.type === 'session' ? (
                      <Target className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Trophy className="h-4 w-4 text-green-500" />
                    )}
                    <div>
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-muted-foreground">{activity.description}</div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Date(activity.date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity logged yet</p>
              <p className="text-sm">Start by logging your first session or match!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Activity List */}
      <DashboardContent />
    </div>
  );
};

export default PlayerDashboard;
