
import { AmbassadorService } from './AmbassadorService';
import { AmbassadorContentManager } from './AmbassadorContentManager';
import { ConversationalContentEngine } from './ConversationalContentEngine';
import { EnhancedAmbassadorProfileService } from './EnhancedAmbassadorProfileService';

export class ConversationalAmbassadorService extends AmbassadorService {
  private contentManager: AmbassadorContentManager;
  private contentEngine: ConversationalContentEngine;
  private enhancedProfileService: EnhancedAmbassadorProfileService;

  constructor() {
    super();
    this.contentManager = AmbassadorContentManager.getInstance();
    this.contentEngine = ConversationalContentEngine.getInstance();
    this.enhancedProfileService = EnhancedAmbassadorProfileService.getInstance();
  }

  async initializeConversationalAmbassadors(): Promise<boolean> {
    try {
      console.log('🎭 Initializing Enhanced Conversational Ambassadors...');
      
      // Create enhanced AI profiles with complete data
      const profilesCreated = await this.enhancedProfileService.createEnhancedAIProfiles();
      
      if (profilesCreated) {
        // Seed initial conversational content
        await this.contentManager.seedInitialAmbassadorPosts();
        
        // Start the encouraging reply system
        await this.contentManager.scheduleEncouragingReplies();
        
        console.log('✅ Enhanced Conversational Ambassadors initialized successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error initializing Enhanced Conversational Ambassadors:', error);
      return false;
    }
  }

  async startWeeklyContentRotation(): Promise<void> {
    // Schedule weekly content drops (in production, this would be a cron job)
    setInterval(async () => {
      await this.contentManager.performWeeklyContentDrop();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
    
    // Schedule daily encouraging replies
    setInterval(async () => {
      await this.contentManager.scheduleEncouragingReplies();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  async getConversationalStats(): Promise<{
    totalPosts: number;
    avgReactions: number;
    recentActivity: number;
    personalities: number;
    aiUsers: number;
  }> {
    const baseStats = await this.contentManager.getAmbassadorEngagementStats();
    const personalities = this.contentEngine.getPersonalities();
    const aiUsers = await this.enhancedProfileService.getAllAIUsers();
    
    return {
      ...baseStats,
      personalities: personalities.length,
      aiUsers: aiUsers.length
    };
  }

  getContentEngine(): ConversationalContentEngine {
    return this.contentEngine;
  }

  getContentManager(): AmbassadorContentManager {
    return this.contentManager;
  }

  getEnhancedProfileService(): EnhancedAmbassadorProfileService {
    return this.enhancedProfileService;
  }

  async getAIUserById(userId: string) {
    return await this.enhancedProfileService.getAIUserProfile(userId);
  }

  async getAllAIUsers() {
    return await this.enhancedProfileService.getAllAIUsers();
  }
}
