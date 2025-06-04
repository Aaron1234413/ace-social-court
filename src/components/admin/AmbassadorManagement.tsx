
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AmbassadorService, AmbassadorPersona } from '@/services/AmbassadorService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Settings, 
  Play,
  Pause,
  Plus,
  BarChart3
} from 'lucide-react';

interface AmbassadorStats {
  total: number;
  active: number;
  postsThisWeek: number;
  avgEngagement: number;
}

export function AmbassadorManagement() {
  const [ambassadors, setAmbassadors] = useState<AmbassadorPersona[]>([]);
  const [stats, setStats] = useState<AmbassadorStats>({
    total: 0,
    active: 0,
    postsThisWeek: 0,
    avgEngagement: 0
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    loadAmbassadors();
    loadStats();
  }, []);

  const loadAmbassadors = () => {
    const ambassadorService = AmbassadorService.getInstance();
    const personas = ambassadorService.getAmbassadorPersonas();
    setAmbassadors(personas);
  };

  const loadStats = async () => {
    try {
      // Get ambassador count
      const { count: totalCount } = await supabase
        .from('ambassador_profiles')
        .select('*', { count: 'exact' });

      const { count: activeCount } = await supabase
        .from('ambassador_profiles')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Get posts this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('is_auto_generated', true)
        .gte('created_at', weekAgo.toISOString());

      // Get average engagement
      const { data: engagementData } = await supabase
        .from('posts')
        .select('engagement_score')
        .eq('is_auto_generated', true)
        .not('engagement_score', 'is', null);

      const avgEngagement = engagementData?.length 
        ? engagementData.reduce((sum, post) => sum + (post.engagement_score || 0), 0) / engagementData.length
        : 0;

      setStats({
        total: totalCount || 0,
        active: activeCount || 0,
        postsThisWeek: postsCount || 0,
        avgEngagement: Math.round(avgEngagement)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateAmbassadors = async () => {
    setIsCreating(true);
    try {
      const ambassadorService = AmbassadorService.getInstance();
      const success = await ambassadorService.createAmbassadorProfiles();
      
      if (success) {
        toast.success('Ambassador profiles created successfully!');
        loadStats();
      } else {
        toast.error('Some ambassador profiles failed to create');
      }
    } catch (error) {
      console.error('Error creating ambassadors:', error);
      toast.error('Failed to create ambassador profiles');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSchedulePosts = async () => {
    setIsScheduling(true);
    try {
      const ambassadorService = AmbassadorService.getInstance();
      await ambassadorService.scheduleAmbassadorPosts();
      toast.success('Ambassador posts scheduled successfully!');
      loadStats();
    } catch (error) {
      console.error('Error scheduling posts:', error);
      toast.error('Failed to schedule ambassador posts');
    } finally {
      setIsScheduling(false);
    }
  };

  const getSkillLevelColor = (skillLevel: string) => {
    switch (skillLevel) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ambassador Management</h1>
          <p className="text-gray-600 mt-2">
            Manage AI-powered ambassador accounts to populate feeds with authentic content
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleCreateAmbassadors}
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? 'Creating...' : 'Create Ambassadors'}
          </Button>
          
          <Button
            onClick={handleSchedulePosts}
            disabled={isScheduling}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            {isScheduling ? 'Scheduling...' : 'Schedule Posts'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ambassadors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Auto-generated content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgEngagement}</div>
            <p className="text-xs text-muted-foreground">
              Engagement score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Quality</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              Authenticity score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ambassador Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Ambassador Profiles</CardTitle>
          <p className="text-sm text-muted-foreground">
            Diverse personas representing different skill levels and tennis journeys
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {ambassadors.map((ambassador) => (
              <div key={ambassador.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={ambassador.profile.avatar_url} />
                    <AvatarFallback>
                      {ambassador.profile.full_name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{ambassador.profile.full_name}</h3>
                      <Badge 
                        variant="secondary" 
                        className={getSkillLevelColor(ambassador.profile.skill_level)}
                      >
                        {ambassador.profile.skill_level}
                      </Badge>
                      <Badge variant="outline">
                        {ambassador.profile.user_type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      @{ambassador.profile.username} • {ambassador.profile.location_name}
                    </p>
                    
                    <p className="text-sm mb-4">{ambassador.profile.bio}</p>
                    
                    {/* Content Mix */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Content Distribution:</p>
                      <div className="flex gap-2 text-xs">
                        {Object.entries(ambassador.posting_schedule.content_mix).map(([type, percentage]) => (
                          <span key={type} className="bg-gray-100 px-2 py-1 rounded">
                            {type}: {percentage}%
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Posting Schedule */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                      <span>📅 {ambassador.posting_schedule.frequency} posts/week</span>
                      <span>🕐 {ambassador.posting_schedule.preferred_times.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
