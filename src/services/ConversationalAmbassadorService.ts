
import { AmbassadorService } from './AmbassadorService';
import { AmbassadorContentManager } from './AmbassadorContentManager';
import { ConversationalContentEngine } from './ConversationalContentEngine';

export class ConversationalAmbassadorService extends AmbassadorService {
  private contentManager: AmbassadorContentManager;
  private contentEngine: ConversationalContentEngine;

  constructor() {
    super();
    this.contentManager = AmbassadorContentManager.getInstance();
    this.contentEngine = ConversationalContentEngine.getInstance();
  }

  async initializeConversationalAmbassadors(): Promise<boolean> {
    try {
      console.log('🎭 Initializing Conversational Ambassadors...');
      
      // First, create Ambassador profiles using the base service
      const profilesCreated = await this.createAmbassadorProfiles();
      
      if (profilesCreated) {
        // Seed initial conversational content
        await this.contentManager.seedInitialAmbassadorPosts();
        
        // Start the encouraging reply system
        await this.contentManager.scheduleEncouragingReplies();
        
        console.log('✅ Conversational Ambassadors initialized successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error initializing Conversational Ambassadors:', error);
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
  }> {
    const baseStats = await this.contentManager.getAmbassadorEngagementStats();
    const personalities = this.contentEngine.getPersonalities();
    
    return {
      ...baseStats,
      personalities: personalities.length
    };
  }

  getContentEngine(): ConversationalContentEngine {
    return this.contentEngine;
  }

  getContentManager(): AmbassadorContentManager {
    return this.contentManager;
  }
}
