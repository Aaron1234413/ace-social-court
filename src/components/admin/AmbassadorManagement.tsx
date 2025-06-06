
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ConversationalAmbassadorService } from '@/services/ConversationalAmbassadorService';
import { EnhancedAmbassadorProfileService, AIUserProfile } from '@/services/EnhancedAmbassadorProfileService';
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
  BarChart3,
  Bot,
  Star,
  Award
} from 'lucide-react';

interface AmbassadorStats {
  total: number;
  active: number;
  postsThisWeek: number;
  avgEngagement: number;
  aiUsers: number;
}

export function AmbassadorManagement() {
  const [aiUsers, setAiUsers] = useState<AIUserProfile[]>([]);
  const [stats, setStats] = useState<AmbassadorStats>({
    total: 0,
    active: 0,
    postsThisWeek: 0,
    avgEngagement: 0,
    aiUsers: 0
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    loadAIUsers();
    loadStats();
  }, []);

  const loadAIUsers = async () => {
    try {
      const profileService = EnhancedAmbassadorProfileService.getInstance();
      const users = await profileService.getAllAIUsers();
      setAiUsers(users);
    } catch (error) {
      console.error('Error loading AI users:', error);
    }
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

      // Get AI users count
      const { count: aiUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('is_ai_user', true);

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
        avgEngagement: Math.round(avgEngagement),
        aiUsers: aiUsersCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateAmbassadors = async () => {
    setIsCreating(true);
    try {
      const conversationalService = new ConversationalAmbassadorService();
      const success = await conversationalService.initializeConversationalAmbassadors();
      
      if (success) {
        toast.success('Enhanced AI ambassador profiles created successfully!');
        loadStats();
        loadAIUsers();
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
      const conversationalService = new ConversationalAmbassadorService();
      const contentManager = conversationalService.getContentManager();
      await contentManager.performWeeklyContentDrop();
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

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'coach': return <Users className="h-4 w-4" />;
      case 'ambassador': return <Star className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced AI Ambassador Management</h1>
          <p className="text-gray-600 mt-2">
            Manage AI-powered ambassador accounts with complete profiles, stats, and achievements
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleCreateAmbassadors}
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? 'Creating...' : 'Create AI Ambassadors'}
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
            <CardTitle className="text-sm font-medium">AI Users</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiUsers}</div>
            <p className="text-xs text-muted-foreground">
              Enhanced profiles
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

      {/* Enhanced AI User Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Enhanced AI User Profiles
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete AI personas with stats, achievements, and personality traits
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {aiUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {user.full_name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg">{user.full_name}</h3>
                      <Badge 
                        variant="secondary" 
                        className={getSkillLevelColor(user.skill_level)}
                      >
                        {user.skill_level}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getUserTypeIcon(user.user_type)}
                        {user.user_type}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        <Bot className="h-3 w-3 mr-1" />
                        AI User
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      @{user.username} • {user.location_name}
                    </p>
                    
                    <p className="text-sm mb-4 text-gray-700">{user.bio}</p>
                    
                    {/* Stats Display */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      {Object.entries(user.stats).map(([key, value]) => (
                        <div key={key} className="text-center p-2 bg-white rounded-lg shadow-sm">
                          <div className="text-lg font-bold text-blue-600">{value}</div>
                          <div className="text-xs text-gray-600 capitalize">
                            {key.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Featured Achievements */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Featured Achievements:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {user.achievements
                          .filter(achievement => achievement.is_featured)
                          .slice(0, 3)
                          .map((achievement, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            🏆 {achievement.title}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* AI Personality Info */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                      <span>🤖 Personality: {user.ai_personality_type?.replace('_', ' ')}</span>
                      <span>💬 Response Active</span>
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
