import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, ChevronUp, Star, StarOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { StudentFilters } from './StudentFilters';
import { AmbassadorFallback } from './AmbassadorFallback';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface StudentActivity {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  posts_this_week: number;
  status: 'active' | 'plateau' | 'at-risk';
  last_post_date?: string;
  is_starred?: boolean;
}

interface RecentActiveStudentsProps {
  onToggleStar?: (studentId: string) => void;
}

export function RecentActiveStudents({ onToggleStar }: RecentActiveStudentsProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'plateau' | 'at-risk'>('all');
  const [showAll, setShowAll] = useState(false);
  const [starredStudentIds, setStarredStudentIds] = useState<string[]>([]);
  const INITIAL_LOAD = 20;

  // Fetch student activity data
  const { data: studentActivity, isLoading } = useQuery({
    queryKey: ['student-activity', user?.id, activeFilter],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get students assigned to this coach
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('assigned_coach_id', user.id);
      
      if (error) throw error;
      
      // Add mock activity data
      const activities: StudentActivity[] = students?.map(student => ({
        id: student.id,
        full_name: student.full_name || '',
        username: student.username || '',
        avatar_url: student.avatar_url,
        posts_this_week: Math.floor(Math.random() * 8),
        status: ['active', 'plateau', 'at-risk'][Math.floor(Math.random() * 3)] as 'active' | 'plateau' | 'at-risk',
        last_post_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_starred: starredStudentIds.includes(student.id)
      })) || [];
      
      // Filter by status if not 'all'
      if (activeFilter !== 'all') {
        return activities.filter(activity => activity.status === activeFilter);
      }
      
      // Sort by last post date
      return activities.sort((a, b) => {
        if (!a.last_post_date && !b.last_post_date) return 0;
        if (!a.last_post_date) return 1;
        if (!b.last_post_date) return -1;
        return new Date(b.last_post_date).getTime() - new Date(a.last_post_date).getTime();
      });
    },
    enabled: !!user?.id
  });

  const handleToggleStar = (studentId: string) => {
    const isStarred = starredStudentIds.includes(studentId);
    
    if (isStarred) {
      setStarredStudentIds(prev => prev.filter(id => id !== studentId));
    } else {
      if (starredStudentIds.length >= 5) {
        // Could show toast here but keeping it simple
        return;
      }
      setStarredStudentIds(prev => [...prev, studentId]);
    }
    
    // Call parent handler if provided
    if (onToggleStar) {
      onToggleStar(studentId);
    }
  };

  const totalActivePosts = studentActivity?.reduce((sum, student) => sum + student.posts_this_week, 0) || 0;
  const displayedStudents = showAll ? studentActivity : studentActivity?.slice(0, INITIAL_LOAD);
  const hasMore = (studentActivity?.length || 0) > INITIAL_LOAD;

  const formatLastPost = (dateString?: string) => {
    if (!dateString) return 'No recent posts';
    
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'plateau': return 'bg-yellow-100 text-yellow-800';
      case 'at-risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show ambassador fallback if very low activity
  if (!isLoading && totalActivePosts < 3) {
    return <AmbassadorFallback totalPosts={totalActivePosts} />;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Student Activity
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalActivePosts} posts this week
          </Badge>
        </div>
        
        <StudentFilters 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          studentCounts={{
            all: studentActivity?.length || 0,
            active: studentActivity?.filter(s => s.status === 'active').length || 0,
            plateau: studentActivity?.filter(s => s.status === 'plateau').length || 0,
            'at-risk': studentActivity?.filter(s => s.status === 'at-risk').length || 0
          }}
        />
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : displayedStudents && displayedStudents.length > 0 ? (
          <>
            <div className="space-y-3">
              {displayedStudents.map((student) => (
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
                        {student.posts_this_week} posts • {formatLastPost(student.last_post_date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(student.status)}`}>
                      {student.status}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStar(student.id)}
                      className={starredStudentIds.includes(student.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}
                    >
                      {starredStudentIds.includes(student.id) ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMore && !showAll && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                  className="flex items-center gap-2"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load More ({(studentActivity?.length || 0) - INITIAL_LOAD} more)
                </Button>
              </div>
            )}
            
            {showAll && hasMore && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(false)}
                  className="flex items-center gap-2"
                >
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">No student activity</p>
            <p className="text-sm mt-1">Student posts and training logs will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
