
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
  Award,
  CalendarPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard';
import DashboardContent from './DashboardContent';

const PlayerDashboard = () => {
  const { user } = useAuth();
  
  // Set up real-time subscriptions
  useRealtimeDashboard();

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

  // Get upcoming activities (future sessions and matches)
  const { data: upcomingActivities } = useQuery({
    queryKey: ['dashboard-upcoming-activities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get upcoming sessions and matches
      const [upcomingSessions, upcomingMatches] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, session_date, focus_areas')
          .eq('user_id', user.id)
          .gte('session_date', today)
          .order('session_date', { ascending: true })
          .limit(3),
        supabase
          .from('matches')
          .select('id, match_date, score, location')
          .eq('user_id', user.id)
          .gte('match_date', today)
          .order('match_date', { ascending: true })
          .limit(3)
      ]);

      const activities = [];
      
      // Add upcoming sessions
      if (upcomingSessions.data) {
        upcomingSessions.data.forEach(session => {
          activities.push({
            type: 'session',
            date: session.session_date,
            title: `Training Session`,
            description: session.focus_areas?.length > 0 ? session.focus_areas.join(', ') : 'General training'
          });
        });
      }

      // Add upcoming matches
      if (upcomingMatches.data) {
        upcomingMatches.data.forEach(match => {
          activities.push({
            type: 'match',
            date: match.match_date,
            title: `Match`,
            description: match.location || 'Tennis match'
          });
        });
      }

      // Sort by date and return most upcoming
      return activities
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
    },
    enabled: !!user?.id
  });

  return (
    <div className="space-y-4 md:space-y-6 px-3 md:px-4 lg:px-0">
      {/* Hero Section with Streak - Enhanced Mobile Design */}
      <div className="text-center py-6 md:py-8 lg:py-12 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl mx-1 md:mx-0">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <Flame className="h-10 w-10 md:h-12 md:w-12 text-orange-500 drop-shadow-lg animate-pulse-subtle" />
            <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-orange-600 rounded-full animate-bounce-subtle"></div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {currentStreak || 0}
            </div>
            <div className="text-lg md:text-xl lg:text-2xl text-gray-700 font-medium">
              {currentStreak && currentStreak > 0 ? "day streak" : "Start your streak!"}
            </div>
          </div>
        </div>
        <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto px-4">
          {currentStreak && currentStreak > 0 
            ? "🔥 Keep the momentum going! Log today's session to maintain your streak."
            : "🔥 Log your first session or match to start building your training streak."
          }
        </p>
      </div>

      {/* Quick Actions Panel - Enhanced Mobile Touch */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold">
            <Plus className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button 
              asChild 
              size="lg" 
              className="h-16 md:h-20 p-4 justify-start text-left bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            >
              <Link to="/log-session">
                <div className="flex items-center gap-4 w-full">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Target className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-base md:text-lg">Log Today's Session</div>
                    <div className="text-xs md:text-sm text-white/80">Record your practice session</div>
                  </div>
                </div>
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="h-16 md:h-20 p-4 justify-start text-left border-2 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            >
              <Link to="/schedule-match">
                <div className="flex items-center gap-4 w-full">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarPlus className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-base md:text-lg">Schedule Match</div>
                    <div className="text-xs md:text-sm text-gray-600">Set up your next match</div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* This Week's Sessions - Enhanced Progress */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold">
            <Calendar className="h-5 w-5 text-blue-500" />
            This Week's Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium text-gray-700">
                {weeklyProgress?.current || 0} of {weeklyProgress?.goal || 5} sessions completed
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-bold text-primary">
                  {Math.round(weeklyProgress?.percentage || 0)}%
                </span>
                {weeklyProgress?.current === weeklyProgress?.goal && (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
            <Progress 
              value={weeklyProgress?.percentage || 0} 
              className="h-4 md:h-5 bg-gray-100 shadow-inner" 
            />
            <p className="text-xs md:text-sm text-gray-600 text-center p-3 bg-gray-50 rounded-lg">
              {weeklyProgress?.current === weeklyProgress?.goal 
                ? "🎉 Week completed! Great job staying consistent."
                : `🎯 ${(weeklyProgress?.goal || 5) - (weeklyProgress?.current || 0)} more sessions to reach your weekly goal.`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview - Enhanced Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-blue-700">Total Sessions</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Target className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-blue-800">{sessionsCount || 0}</div>
            <p className="text-xs text-blue-600 mt-1">
              training sessions logged
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-green-700">Total Matches</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <Trophy className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-green-800">{matchesCount || 0}</div>
            <p className="text-xs text-green-600 mt-1">
              matches played
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-purple-700">This Month</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-purple-800">{Math.max(sessionsCount || 0, matchesCount || 0)}</div>
            <p className="text-xs text-purple-600 mt-1">
              activities logged
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-orange-700">Best Streak</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg">
              <Flame className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-orange-800">{currentStreak || 0}</div>
            <p className="text-xs text-orange-600 mt-1">
              consecutive days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Activities - Enhanced Design */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold">
            <BarChart2 className="h-5 w-5 text-indigo-500" />
            Upcoming Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {upcomingActivities && upcomingActivities.length > 0 ? (
            <div className="space-y-3">
              {upcomingActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activity.type === 'session' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {activity.type === 'session' ? (
                        <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                      ) : (
                        <Trophy className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm md:text-base text-gray-900">{activity.title}</div>
                      <div className="text-xs md:text-sm text-gray-600 truncate">{activity.description}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs font-medium px-3 py-1">
                    {new Date(activity.date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-sm md:text-base font-medium">No upcoming activities scheduled</p>
              <p className="text-xs md:text-sm mt-1">Schedule your next session or match to see them here!</p>
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
