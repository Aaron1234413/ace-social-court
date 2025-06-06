
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, Users, Star, Award } from 'lucide-react';
import { AIUserSocialService } from '@/services/AIUserSocialService';
import { EnhancedAmbassadorProfileService } from '@/services/EnhancedAmbassadorProfileService';
import EnhancedFollowButton from '@/components/social/EnhancedFollowButton';
import { useAuth } from '@/components/AuthProvider';

interface AIUserDiscoveryProps {
  maxUsers?: number;
  showHeader?: boolean;
}

interface AIUserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_ai_user: boolean;
  ai_personality_type: string | null;
  skill_level: string | null;
  bio: string | null;
  location_name: string | null;
  achievements?: any[];
  stats?: any;
}

export function AIUserDiscovery({ maxUsers = 6, showHeader = true }: AIUserDiscoveryProps) {
  const { user } = useAuth();
  const [aiUsers, setAiUsers] = useState<AIUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const aiSocialService = AIUserSocialService.getInstance();
  const enhancedProfileService = EnhancedAmbassadorProfileService.getInstance();

  useEffect(() => {
    loadAIUsers();
  }, [user]);

  const loadAIUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get discoverable AI users, excluding current user
      const excludeIds = user ? [user.id] : [];
      const users = await aiSocialService.getDiscoverableAIUsers(excludeIds);
      
      // Get detailed profiles for each AI user
      const detailedUsers = await Promise.all(
        users.slice(0, maxUsers).map(async (aiUser) => {
          try {
            const profile = await enhancedProfileService.getAIUserProfile(aiUser.id);
            return {
              ...aiUser,
              ...profile,
              location: aiUser.location_name
            };
          } catch (error) {
            console.error('Error getting detailed profile for AI user:', aiUser.id, error);
            return aiUser;
          }
        })
      );

      setAiUsers(detailedUsers.filter(Boolean));
    } catch (error) {
      console.error('Error loading AI users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonalityIcon = (personalityType: string) => {
    const icons = {
      encouraging_coach: '🌟',
      strategic_player: '🎯',
      fitness_focused: '💪',
      veteran_mentor: '🏆',
      technique_specialist: '🔧',
      recreational_enthusiast: '🎾'
    };
    return icons[personalityType] || '🤖';
  };

  const getPersonalityColor = (personalityType: string) => {
    const colors = {
      encouraging_coach: 'bg-yellow-100 text-yellow-800',
      strategic_player: 'bg-blue-100 text-blue-800',
      fitness_focused: 'bg-green-100 text-green-800',
      veteran_mentor: 'bg-purple-100 text-purple-800',
      technique_specialist: 'bg-gray-100 text-gray-800',
      recreational_enthusiast: 'bg-pink-100 text-pink-800'
    };
    return colors[personalityType] || 'bg-blue-100 text-blue-800';
  };

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              AI Tennis Coaches
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            AI Tennis Coaches
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect with AI coaches for expert tips and guidance
          </p>
        </CardHeader>
      )}
      <CardContent>
        <div className="grid gap-4">
          {aiUsers.map((aiUser) => (
            <div key={aiUser.id} className="flex items-start space-x-3 p-3 border rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {getPersonalityIcon(aiUser.ai_personality_type)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">
                    {aiUser.full_name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {aiUser.bio}
                </p>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPersonalityColor(aiUser.ai_personality_type)}`}
                  >
                    {aiUser.ai_personality_type?.replace('_', ' ')}
                  </Badge>
                  {aiUser.skill_level && (
                    <Badge variant="outline" className="text-xs">
                      {aiUser.skill_level}
                    </Badge>
                  )}
                </div>

                {/* Show a few achievements */}
                {aiUser.achievements && aiUser.achievements.length > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      {aiUser.achievements.filter(a => a.is_featured).length} achievements
                    </span>
                  </div>
                )}

                {/* Show key stats */}
                {aiUser.stats && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                    {aiUser.stats.years_experience && (
                      <span>{aiUser.stats.years_experience} years exp.</span>
                    )}
                    {aiUser.stats.students_coached && (
                      <span>{aiUser.stats.students_coached}+ students</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <EnhancedFollowButton
                  userId={aiUser.id}
                  username={aiUser.username}
                  fullName={aiUser.full_name}
                  isAIUser={true}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
        
        {aiUsers.length === 0 && !isLoading && (
          <div className="text-center py-6 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No AI coaches available at the moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
