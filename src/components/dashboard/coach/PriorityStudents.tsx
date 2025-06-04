
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, StarOff, Users, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  posts_this_week?: number;
  status?: 'active' | 'plateau' | 'at-risk';
  last_post_date?: string;
}

export function PriorityStudents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch coach profile with starred students
  const { data: profile } = useQuery({
    queryKey: ['coach-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('starred_students')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch starred students data
  const { data: starredStudents, isLoading } = useQuery({
    queryKey: ['starred-students', user?.id, profile?.starred_students],
    queryFn: async () => {
      if (!user?.id || !profile?.starred_students?.length) return [];
      
      const studentIds = profile.starred_students;
      
      // Get student profiles
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', studentIds);
      
      if (studentsError) throw studentsError;
      
      // Get activity data
      const { data: activities, error: activitiesError } = await supabase
        .from('student_activity_summary')
        .select('student_id, posts_this_week, status, last_post_date')
        .eq('coach_id', user.id)
        .in('student_id', studentIds);
      
      if (activitiesError) throw activitiesError;
      
      // Merge data
      const studentsWithActivity = students?.map(student => {
        const activity = activities?.find(a => a.student_id === student.id);
        return {
          ...student,
          posts_this_week: activity?.posts_this_week || 0,
          status: activity?.status || 'at-risk',
          last_post_date: activity?.last_post_date
        } as Student;
      }) || [];
      
      return studentsWithActivity;
    },
    enabled: !!user?.id && !!profile?.starred_students
  });

  // Mutation to update starred students
  const updateStarredStudents = useMutation({
    mutationFn: async (newStarredStudents: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ starred_students: newStarredStudents })
        .eq('id', user.id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-profile'] });
      queryClient.invalidateQueries({ queryKey: ['starred-students'] });
      toast.success('Priority students updated');
    },
    onError: (error) => {
      console.error('Error updating starred students:', error);
      toast.error('Failed to update priority students');
    }
  });

  const toggleStar = (studentId: string) => {
    const currentStarred = profile?.starred_students || [];
    const isStarred = currentStarred.includes(studentId);
    
    if (isStarred) {
      // Remove star
      const newStarred = currentStarred.filter(id => id !== studentId);
      updateStarredStudents.mutate(newStarred);
    } else {
      // Add star (max 5)
      if (currentStarred.length >= 5) {
        toast.error('You can only star up to 5 students');
        return;
      }
      const newStarred = [...currentStarred, studentId];
      updateStarredStudents.mutate(newStarred);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'plateau': return 'bg-yellow-100 text-yellow-800';
      case 'at-risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const starredCount = profile?.starred_students?.length || 0;
  const maxStars = 5;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Priority Students
          </CardTitle>
          <TooltipProvider>
            <Tooltip open={showTooltip && starredCount === 0} onOpenChange={setShowTooltip}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTooltip(!showTooltip)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Star up to 5 students to see them here</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {starredCount < maxStars && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-600" />
              <span>Star up to {maxStars - starredCount} more students to prioritize them</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : starredStudents && starredStudents.length > 0 ? (
          <div className="space-y-3">
            {starredStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatar_url} />
                    <AvatarFallback>
                      {student.full_name?.charAt(0) || student.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {student.full_name || student.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {student.posts_this_week} posts this week
                    </div>
                  </div>
                  
                  <Badge className={`text-xs ${getStatusColor(student.status || 'at-risk')}`}>
                    {student.status || 'at-risk'}
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStar(student.id)}
                  className="text-yellow-500 hover:text-yellow-600"
                >
                  <Star className="h-4 w-4 fill-current" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">No priority students yet</p>
            <p className="text-sm mt-1">Star students from your activity feed to see them here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
