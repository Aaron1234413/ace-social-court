import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Plus,
  BarChart2,
  Award,
  Target,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Circle,
  Trophy,
  Star,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard';
import { toast } from 'sonner';

const CoachDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("lessons");

  // Set up real-time subscriptions
  useRealtimeDashboard();

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

  // Get today's lessons (sessions scheduled for today)
  const { data: todaysLessons } = useQuery({
    queryKey: ['coach-todays-lessons', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
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
        .eq('session_date', today)
        .order('session_date', { ascending: true });

      if (error) {
        console.error('Error fetching today\'s lessons:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id
  });

  // Get student activities that need review
  const { data: studentActivities } = useQuery({
    queryKey: ['coach-student-activities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get sessions where coach_id is null (logged by players) or sessions that need sign-off
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          session_date,
          focus_areas,
          session_note,
          user_id,
          drills,
          profiles!sessions_user_id_fkey(username, full_name)
        `)
        .is('coach_id', null)
        .order('session_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching student activities:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id
  });

  // Get coaching milestones
  const { data: coachingMilestones } = useQuery({
    queryKey: ['coaching-milestones', user?.id],
    queryFn: async () => {
      const sessionCount = coachSessionsCount || 0;
      const milestones = [];
      
      if (sessionCount >= 100) milestones.push({ title: "🎖️ Century Coach", description: "100+ Sessions Coached" });
      if (sessionCount >= 50) milestones.push({ title: "🏆 Expert Coach", description: "50+ Sessions Coached" });
      if (sessionCount >= 25) milestones.push({ title: "⭐ Rising Coach", description: "25+ Sessions Coached" });
      if (sessionCount >= 10) milestones.push({ title: "🎾 Active Coach", description: "10+ Sessions Coached" });
      
      return milestones.slice(0, 3); // Show top 3 milestones
    },
    enabled: !!coachSessionsCount
  });

  // Mutation to update lesson status
  const updateLessonStatus = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string, status: string }) => {
      // For now, we'll use session_note to store status
      // In a full implementation, you'd add a status column to the sessions table
      const { error } = await supabase
        .from('sessions')
        .update({ 
          session_note: `Status: ${status}${status === 'COMPLETED' ? ' - Lesson completed' : status === 'CANCELLED' ? ' - Lesson cancelled' : ' - Lesson scheduled'}`
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-todays-lessons'] });
      toast.success("Lesson status updated successfully!");
    },
    onError: (error) => {
      console.error('Error updating lesson status:', error);
      toast.error("Failed to update lesson status");
    }
  });

  // Mutation to sign off student session
  const signOffSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('sessions')
        .update({ coach_id: user?.id })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-student-activities'] });
      queryClient.invalidateQueries({ queryKey: ['coach-dashboard-sessions-count'] });
      toast.success("Session signed off successfully!");
    },
    onError: (error) => {
      console.error('Error signing off session:', error);
      toast.error("Failed to sign off session");
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Circle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusFromNote = (note: string | null) => {
    if (!note) return 'ON';
    if (note.includes('Status: COMPLETED')) return 'COMPLETED';
    if (note.includes('Status: CANCELLED')) return 'CANCELLED';
    return 'ON';
  };

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Mobile-optimized Stats Overview for Coaches */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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

        <Card className="touch-manipulation col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Today's Lessons</CardTitle>
            <Calendar className="h-5 w-5 md:h-4 md:w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">
              {todaysLessons?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              scheduled for today
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

      {/* Tabbed Interface */}
      <Card className="touch-manipulation">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl">Coach Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="lessons" className="text-xs md:text-sm">Today's Lessons</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs md:text-sm">Student Activity</TabsTrigger>
              <TabsTrigger value="growth" className="text-xs md:text-sm">Growth Hub</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lessons" className="mt-0">
              <div className="space-y-3">
                {todaysLessons && todaysLessons.length > 0 ? (
                  todaysLessons.map((lesson) => {
                    const status = getStatusFromNote(lesson.session_note);
                    return (
                      <div key={lesson.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm md:text-base">
                                {Array.isArray(lesson.profiles) && lesson.profiles.length > 0 
                                  ? lesson.profiles[0]?.full_name || lesson.profiles[0]?.username || 'Student'
                                  : 'Student'}
                              </div>
                              {getStatusIcon(status)}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs md:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Today</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>Tennis Court</span>
                              </div>
                            </div>
                            {lesson.focus_areas && lesson.focus_areas.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-muted-foreground">Focus Areas:</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {lesson.focus_areas.map((area, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {area}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={status === 'ON' ? 'default' : 'outline'}
                            onClick={() => updateLessonStatus.mutate({ sessionId: lesson.id, status: 'ON' })}
                            disabled={updateLessonStatus.isPending}
                            className="text-xs"
                          >
                            ON
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'CANCELLED' ? 'destructive' : 'outline'}
                            onClick={() => updateLessonStatus.mutate({ sessionId: lesson.id, status: 'CANCELLED' })}
                            disabled={updateLessonStatus.isPending}
                            className="text-xs"
                          >
                            CANCELLED
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'COMPLETED' ? 'default' : 'outline'}
                            onClick={() => updateLessonStatus.mutate({ sessionId: lesson.id, status: 'COMPLETED' })}
                            disabled={updateLessonStatus.isPending}
                            className="text-xs"
                          >
                            COMPLETED
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm md:text-base">No lessons scheduled for today</p>
                    <p className="text-xs md:text-sm">Check back tomorrow or schedule new lessons!</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-0">
              <div className="space-y-3">
                {studentActivities && studentActivities.length > 0 ? (
                  studentActivities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm md:text-base">
                            {Array.isArray(activity.profiles) && activity.profiles.length > 0 
                              ? activity.profiles[0]?.full_name || activity.profiles[0]?.username || 'Student'
                              : 'Student'}
                          </div>
                          <div className="text-xs md:text-sm text-muted-foreground">
                            Session on {new Date(activity.session_date).toLocaleDateString()}
                          </div>
                          {activity.focus_areas && activity.focus_areas.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {activity.focus_areas.map((area, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Needs Review
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => signOffSession.mutate(activity.id)}
                          disabled={signOffSession.isPending}
                          className="text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sign Off
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="text-xs"
                        >
                          <Link to={`/log-session?player=${activity.user_id}`}>
                            <Plus className="h-3 w-3 mr-1" />
                            Log Session
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm md:text-base">No student activities to review</p>
                    <p className="text-xs md:text-sm">Student sessions will appear here when they need your review!</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="growth" className="mt-0">
              <div className="space-y-4">
                {/* Coaching Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Total Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{coachSessionsCount || 0}</div>
                      <p className="text-xs text-muted-foreground">sessions coached</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="h-4 w-4 text-blue-500" />
                        Ranking
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">#1</div>
                      <p className="text-xs text-muted-foreground">in your area</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Coaching Milestones */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Recent Milestones
                  </h4>
                  <div className="space-y-2">
                    {coachingMilestones && coachingMilestones.length > 0 ? (
                      coachingMilestones.map((milestone, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="text-lg">{milestone.title.split(' ')[0]}</div>
                          <div>
                            <div className="font-medium text-sm">{milestone.title.substring(2)}</div>
                            <div className="text-xs text-muted-foreground">{milestone.description}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Keep coaching to unlock milestones!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachDashboard;
