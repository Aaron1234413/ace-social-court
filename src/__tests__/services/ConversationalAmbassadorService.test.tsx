
import { ConversationalAmbassadorService } from '@/services/ConversationalAmbassadorService';
import { AmbassadorContentManager } from '@/services/AmbassadorContentManager';
import { ConversationalContentEngine } from '@/services/ConversationalContentEngine';
import { EnhancedAmbassadorProfileService } from '@/services/EnhancedAmbassadorProfileService';

// Mock dependencies
jest.mock('@/services/AmbassadorContentManager', () => ({
  AmbassadorContentManager: {
    getInstance: jest.fn(() => ({
      seedInitialAmbassadorPosts: jest.fn(),
      scheduleEncouragingReplies: jest.fn(),
      performWeeklyContentDrop: jest.fn(),
      getAmbassadorEngagementStats: jest.fn(() => ({
        totalPosts: 50,
        avgReactions: 12,
        recentActivity: 8,
      })),
    })),
  },
}));

jest.mock('@/services/ConversationalContentEngine', () => ({
  ConversationalContentEngine: {
    getInstance: jest.fn(() => ({
      getPersonalities: jest.fn(() => [
        { id: 'personality-1', name: 'Encouraging Coach' },
        { id: 'personality-2', name: 'Technical Expert' },
      ]),
    })),
  },
}));

jest.mock('@/services/EnhancedAmbassadorProfileService', () => ({
  EnhancedAmbassadorProfileService: {
    getInstance: jest.fn(() => ({
      createEnhancedAIProfiles: jest.fn(),
      getAllAIUsers: jest.fn(() => [
        { id: 'ai-1', full_name: 'AI Coach 1' },
        { id: 'ai-2', full_name: 'AI Coach 2' },
      ]),
      getAIUserProfile: jest.fn(),
    })),
  },
}));

describe('ConversationalAmbassadorService', () => {
  let service: ConversationalAmbassadorService;
  let mockContentManager: jest.Mocked<AmbassadorContentManager>;
  let mockContentEngine: jest.Mocked<ConversationalContentEngine>;
  let mockProfileService: jest.Mocked<EnhancedAmbassadorProfileService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConversationalAmbassadorService();
    mockContentManager = (AmbassadorContentManager.getInstance as jest.Mock)();
    mockContentEngine = (ConversationalContentEngine.getInstance as jest.Mock)();
    mockProfileService = (EnhancedAmbassadorProfileService.getInstance as jest.Mock)();
  });

  describe('initializeConversationalAmbassadors', () => {
    it('initializes ambassadors successfully', async () => {
      mockProfileService.createEnhancedAIProfiles.mockResolvedValue(true);

      const result = await service.initializeConversationalAmbassadors();

      expect(result).toBe(true);
      expect(mockProfileService.createEnhancedAIProfiles).toHaveBeenCalled();
      expect(mockContentManager.seedInitialAmbassadorPosts).toHaveBeenCalled();
      expect(mockContentManager.scheduleEncouragingReplies).toHaveBeenCalled();
    });

    it('handles profile creation failure', async () => {
      mockProfileService.createEnhancedAIProfiles.mockResolvedValue(false);

      const result = await service.initializeConversationalAmbassadors();

      expect(result).toBe(false);
      expect(mockContentManager.seedInitialAmbassadorPosts).not.toHaveBeenCalled();
    });

    it('handles initialization errors gracefully', async () => {
      mockProfileService.createEnhancedAIProfiles.mockRejectedValue(
        new Error('Profile creation failed')
      );

      const result = await service.initializeConversationalAmbassadors();

      expect(result).toBe(false);
    });
  });

  describe('startWeeklyContentRotation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('schedules weekly content drops', () => {
      service.startWeeklyContentRotation();

      // Fast forward one week
      jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000);

      expect(mockContentManager.performWeeklyContentDrop).toHaveBeenCalled();
    });

    it('schedules daily encouraging replies', () => {
      service.startWeeklyContentRotation();

      // Fast forward one day
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);

      expect(mockContentManager.scheduleEncouragingReplies).toHaveBeenCalled();
    });
  });

  describe('getConversationalStats', () => {
    it('returns comprehensive statistics', async () => {
      const stats = await service.getConversationalStats();

      expect(stats).toEqual({
        totalPosts: 50,
        avgReactions: 12,
        recentActivity: 8,
        personalities: 2,
        aiUsers: 2,
      });
    });

    it('includes personality and AI user counts', async () => {
      const stats = await service.getConversationalStats();

      expect(stats.personalities).toBe(2);
      expect(stats.aiUsers).toBe(2);
      expect(mockContentEngine.getPersonalities).toHaveBeenCalled();
      expect(mockProfileService.getAllAIUsers).toHaveBeenCalled();
    });
  });

  describe('service getters', () => {
    it('provides access to content engine', () => {
      const engine = service.getContentEngine();
      expect(engine).toBe(mockContentEngine);
    });

    it('provides access to content manager', () => {
      const manager = service.getContentManager();
      expect(manager).toBe(mockContentManager);
    });

    it('provides access to enhanced profile service', () => {
      const profileService = service.getEnhancedProfileService();
      expect(profileService).toBe(mockProfileService);
    });
  });

  describe('AI user management', () => {
    it('gets AI user by ID', async () => {
      const mockUser = { id: 'ai-1', full_name: 'AI Coach 1' };
      mockProfileService.getAIUserProfile.mockResolvedValue(mockUser);

      const user = await service.getAIUserById('ai-1');

      expect(user).toBe(mockUser);
      expect(mockProfileService.getAIUserProfile).toHaveBeenCalledWith('ai-1');
    });

    it('gets all AI users', async () => {
      const users = await service.getAllAIUsers();

      expect(users).toHaveLength(2);
      expect(mockProfileService.getAllAIUsers).toHaveBeenCalled();
    });
  });
});
