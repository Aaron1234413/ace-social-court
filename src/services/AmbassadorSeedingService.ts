
import { supabase } from '@/integrations/supabase/client';
import { ConversationalAmbassadorService } from './ConversationalAmbassadorService';

export class AmbassadorSeedingService {
  private static instance: AmbassadorSeedingService;
  private conversationalService: ConversationalAmbassadorService;

  static getInstance(): AmbassadorSeedingService {
    if (!this.instance) {
      this.instance = new AmbassadorSeedingService();
    }
    return this.instance;
  }

  constructor() {
    this.conversationalService = new ConversationalAmbassadorService();
  }

  static async checkAndSeedAmbassadors(): Promise<void> {
    const service = AmbassadorSeedingService.getInstance();
    await service.initializeConversationalSystem();
  }

  private async initializeConversationalSystem(): Promise<void> {
    try {
      console.log('🌱 Checking Ambassador seeding status...');
      
      // Check if we already have Ambassador content
      const { data: existingPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('is_ambassador_content', true)
        .limit(1);

      if (existingPosts && existingPosts.length > 0) {
        console.log('✅ Ambassador content already exists, starting rotation only');
        await this.conversationalService.startWeeklyContentRotation();
        return;
      }

      // Initialize the full conversational system
      const success = await this.conversationalService.initializeConversationalAmbassadors();
      
      if (success) {
        // Start the content rotation system
        await this.conversationalService.startWeeklyContentRotation();
        console.log('🎉 Conversational Ambassador system fully initialized');
      } else {
        console.error('❌ Failed to initialize Conversational Ambassador system');
      }
    } catch (error) {
      console.error('❌ Error in Ambassador seeding:', error);
    }
  }

  async getSystemStats(): Promise<{
    totalPosts: number;
    avgReactions: number;
    recentActivity: number;
    personalities: number;
    status: 'initializing' | 'active' | 'error';
  }> {
    try {
      const stats = await this.conversationalService.getConversationalStats();
      const status = stats.totalPosts > 0 ? 'active' : 'initializing';
      
      return {
        ...stats,
        status
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        totalPosts: 0,
        avgReactions: 0,
        recentActivity: 0,
        personalities: 0,
        status: 'error'
      };
    }
  }
}
