
import { supabase } from '@/integrations/supabase/client';
import { EnhancedAmbassadorProfileService } from './EnhancedAmbassadorProfileService';

export class AIUserSocialService {
  private static instance: AIUserSocialService;
  private enhancedProfileService: EnhancedAmbassadorProfileService;

  static getInstance(): AIUserSocialService {
    if (!this.instance) {
      this.instance = new AIUserSocialService();
    }
    return this.instance;
  }

  constructor() {
    this.enhancedProfileService = EnhancedAmbassadorProfileService.getInstance();
  }

  /**
   * Enable AI users to automatically follow back new users
   */
  async handleAutomaticFollowBack(newFollowerId: string, aiUserId: string): Promise<boolean> {
    try {
      // Check if AI user should follow back (based on personality)
      const aiProfile = await this.enhancedProfileService.getAIUserProfile(aiUserId);
      if (!aiProfile) return false;

      // Different personalities have different follow-back rates
      const followBackChance = this.getFollowBackChance(aiProfile.ai_personality_type);
      
      if (Math.random() < followBackChance) {
        // Add a small delay to make it feel more natural
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));

        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: aiUserId,
            following_id: newFollowerId
          });

        if (!error) {
          console.log(`✅ AI user ${aiProfile.full_name} followed back user ${newFollowerId}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error in automatic follow back:', error);
      return false;
    }
  }

  /**
   * Create automated engagement patterns for AI users
   */
  async createAutomatedEngagement(postId: string, authorId: string): Promise<void> {
    try {
      // Get all active AI users
      const aiUsers = await this.enhancedProfileService.getAllAIUsers();
      
      for (const aiUser of aiUsers) {
        // Check if AI user follows the post author
        const { data: isFollowing } = await supabase
          .rpc('is_following', {
            follower_id: aiUser.id,
            following_id: authorId
          });

        if (isFollowing) {
          const engagementChance = this.getEngagementChance(aiUser.ai_personality_type);
          
          if (Math.random() < engagementChance) {
            // Add realistic delay
            const delay = Math.random() * 1800000 + 300000; // 5 minutes to 30 minutes
            
            setTimeout(async () => {
              await this.performEngagementAction(aiUser.id, postId, aiUser.ai_personality_type);
            }, delay);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error creating automated engagement:', error);
    }
  }

  /**
   * Get AI users for search and discovery
   */
  async getDiscoverableAIUsers(excludeUserIds: string[] = []): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          bio,
          avatar_url,
          user_type,
          skill_level,
          location_name,
          is_ai_user,
          ai_personality_type
        `)
        .eq('is_ai_user', true)
        .eq('ai_response_active', true)
        .not('id', 'in', `(${excludeUserIds.join(',')})`)
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching discoverable AI users:', error);
      return [];
    }
  }

  /**
   * Setup AI users to follow highly active users automatically
   */
  async setupAIUserFollowing(): Promise<void> {
    try {
      console.log('🤖 Setting up AI user following patterns...');
      
      const aiUsers = await this.enhancedProfileService.getAllAIUsers();
      
      // Get highly active users (users with recent posts)
      const { data: activeUsers } = await supabase
        .from('posts')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .neq('is_ai_user', true);

      if (!activeUsers) return;

      const userCounts = activeUsers.reduce((acc, post) => {
        acc[post.user_id] = (acc[post.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActiveUsers = Object.entries(userCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([userId]) => userId);

      // Have AI users follow some active users
      for (const aiUser of aiUsers) {
        const followCount = Math.floor(Math.random() * 8) + 3; // 3-10 follows
        const usersToFollow = topActiveUsers
          .sort(() => Math.random() - 0.5)
          .slice(0, followCount);

        for (const userId of usersToFollow) {
          try {
            await supabase
              .from('followers')
              .insert({
                follower_id: aiUser.id,
                following_id: userId
              });
            
            // Small delay between follows
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            // Ignore duplicate follow errors
            continue;
          }
        }
      }

      console.log('✅ AI user following patterns established');
    } catch (error) {
      console.error('❌ Error setting up AI user following:', error);
    }
  }

  private getFollowBackChance(personalityType: string): number {
    const followBackRates = {
      encouraging_coach: 0.8,
      strategic_player: 0.6,
      fitness_focused: 0.9,
      veteran_mentor: 0.7,
      technique_specialist: 0.5,
      recreational_enthusiast: 0.95
    };
    return followBackRates[personalityType] || 0.7;
  }

  private getEngagementChance(personalityType: string): number {
    const engagementRates = {
      encouraging_coach: 0.4,
      strategic_player: 0.3,
      fitness_focused: 0.5,
      veteran_mentor: 0.25,
      technique_specialist: 0.2,
      recreational_enthusiast: 0.6
    };
    return engagementRates[personalityType] || 0.3;
  }

  private async performEngagementAction(aiUserId: string, postId: string, personalityType: string): Promise<void> {
    try {
      // Different personalities prefer different engagement types
      const actions = this.getPreferredEngagementActions(personalityType);
      const action = actions[Math.floor(Math.random() * actions.length)];

      switch (action) {
        case 'like':
          await supabase
            .from('likes')
            .insert({
              user_id: aiUserId,
              post_id: postId
            });
          break;
          
        case 'reaction':
          const reactionTypes = ['love', 'fire', 'tip'];
          const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
          
          await supabase
            .from('post_reactions')
            .insert({
              user_id: aiUserId,
              post_id: postId,
              reaction_type: reactionType
            });
          break;
      }

      console.log(`✅ AI user ${aiUserId} performed ${action} on post ${postId}`);
    } catch (error) {
      console.error('❌ Error performing engagement action:', error);
    }
  }

  private getPreferredEngagementActions(personalityType: string): string[] {
    const actionPreferences = {
      encouraging_coach: ['like', 'reaction', 'like'],
      strategic_player: ['like', 'reaction'],
      fitness_focused: ['reaction', 'like', 'reaction'],
      veteran_mentor: ['like'],
      technique_specialist: ['like'],
      recreational_enthusiast: ['reaction', 'reaction', 'like']
    };
    return actionPreferences[personalityType] || ['like'];
  }
}
