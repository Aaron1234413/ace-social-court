
import { CoachPromptSystem } from '@/services/CoachPromptSystem';
import { ContextPromptEngine } from '@/services/ContextPromptEngine';
import { KeywordAnalyzer } from '@/services/KeywordAnalyzer';
import { mockPosts } from '../mocks/data/posts';

// Mock dependencies
jest.mock('@/services/ContextPromptEngine', () => ({
  ContextPromptEngine: {
    getInstance: jest.fn(() => ({
      generatePrompt: jest.fn(() => ({
        text: 'Base prompt text',
        placeholder: 'Base placeholder',
        requiresCoach: false,
        category: 'contextual',
      })),
    })),
  },
}));

jest.mock('@/services/KeywordAnalyzer', () => ({
  KeywordAnalyzer: {
    analyzeContent: jest.fn(() => []),
    getEmotionalTone: jest.fn(() => 'neutral'),
    hasPerformanceIndicators: jest.fn(() => false),
  },
}));

describe('CoachPromptSystem', () => {
  let coachPromptSystem: CoachPromptSystem;
  let mockContextEngine: jest.Mocked<ContextPromptEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    coachPromptSystem = CoachPromptSystem.getInstance();
    mockContextEngine = (ContextPromptEngine.getInstance as jest.Mock)();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = CoachPromptSystem.getInstance();
      const instance2 = CoachPromptSystem.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateCoachPrompt', () => {
    const mockPost = mockPosts.standard();
    const coachContext = {
      userType: 'coach' as const,
      isCoach: true,
      userFollowings: [],
    };
    const playerContext = {
      userType: 'player' as const,
      isCoach: false,
      userFollowings: [],
    };

    it('generates upgrade prompt for non-coaches', () => {
      const prompt = coachPromptSystem.generateCoachPrompt(
        mockPost,
        playerContext,
        'John Doe'
      );

      expect(prompt.requiresCoach).toBe(true);
      expect(prompt.text).toContain('upgrade');
      expect(prompt.expertise).toBe('technical');
      expect(prompt.actionType).toBe('encourage');
    });

    it('generates coach-specific prompts for coaches', () => {
      (KeywordAnalyzer.analyzeContent as jest.Mock).mockReturnValue([
        { category: 'technical', word: 'technique' },
      ]);
      (KeywordAnalyzer.getEmotionalTone as jest.Mock).mockReturnValue('positive');
      (KeywordAnalyzer.hasPerformanceIndicators as jest.Mock).mockReturnValue(true);

      const prompt = coachPromptSystem.generateCoachPrompt(
        mockPost,
        coachContext,
        'Jane Smith'
      );

      expect(prompt.requiresCoach).toBe(false);
      expect(prompt.expertise).toBe('technical');
      expect(prompt.actionType).toBe('analyze');
      expect(prompt.placeholder).toContain('Jane Smith');
    });

    it('determines technical expertise from content', () => {
      const technicalPost = {
        ...mockPost,
        content: 'Working on my technique and grip today',
      };

      const prompt = coachPromptSystem.generateCoachPrompt(
        technicalPost,
        coachContext
      );

      expect(prompt.expertise).toBe('technical');
    });

    it('determines mental expertise from content', () => {
      const mentalPost = {
        ...mockPost,
        content: 'Feeling nervous about the match, need to work on confidence',
      };

      const prompt = coachPromptSystem.generateCoachPrompt(
        mentalPost,
        coachContext
      );

      expect(prompt.expertise).toBe('mental');
    });

    it('determines tactical expertise from content', () => {
      const tacticalPost = {
        ...mockPost,
        content: 'Played a match today, working on strategy and placement',
      };

      const prompt = coachPromptSystem.generateCoachPrompt(
        tacticalPost,
        coachContext
      );

      expect(prompt.expertise).toBe('tactical');
    });

    it('determines physical expertise from content', () => {
      const physicalPost = {
        ...mockPost,
        content: 'Feeling tired after training, need to work on fitness',
      };

      const prompt = coachPromptSystem.generateCoachPrompt(
        physicalPost,
        coachContext
      );

      expect(prompt.expertise).toBe('physical');
    });

    it('determines encourage action for negative tone', () => {
      (KeywordAnalyzer.getEmotionalTone as jest.Mock).mockReturnValue('negative');

      const prompt = coachPromptSystem.generateCoachPrompt(
        mockPost,
        coachContext
      );

      expect(prompt.actionType).toBe('encourage');
    });

    it('determines analyze action for positive tone with performance', () => {
      (KeywordAnalyzer.getEmotionalTone as jest.Mock).mockReturnValue('positive');
      (KeywordAnalyzer.hasPerformanceIndicators as jest.Mock).mockReturnValue(true);

      const prompt = coachPromptSystem.generateCoachPrompt(
        mockPost,
        coachContext
      );

      expect(prompt.actionType).toBe('analyze');
    });

    it('determines instruct action for question content', () => {
      const questionPost = {
        ...mockPost,
        content: 'How should I improve my serve?',
      };

      const prompt = coachPromptSystem.generateCoachPrompt(
        questionPost,
        coachContext
      );

      expect(prompt.actionType).toBe('instruct');
    });

    it('defaults to question action', () => {
      (KeywordAnalyzer.getEmotionalTone as jest.Mock).mockReturnValue('neutral');
      (KeywordAnalyzer.hasPerformanceIndicators as jest.Mock).mockReturnValue(false);

      const prompt = coachPromptSystem.generateCoachPrompt(
        mockPost,
        coachContext
      );

      expect(prompt.actionType).toBe('question');
    });

    it('generates appropriate placeholders for different actions', () => {
      const testCases = [
        { actionType: 'analyze', expectedText: 'analysis' },
        { actionType: 'encourage', expectedText: 'encourage' },
        { actionType: 'instruct', expectedText: 'improvements' },
        { actionType: 'question', expectedText: 'experience' },
      ];

      testCases.forEach(({ actionType, expectedText }) => {
        (KeywordAnalyzer.getEmotionalTone as jest.Mock).mockReturnValue(
          actionType === 'encourage' ? 'negative' : 
          actionType === 'analyze' ? 'positive' : 'neutral'
        );
        (KeywordAnalyzer.hasPerformanceIndicators as jest.Mock).mockReturnValue(
          actionType === 'analyze'
        );

        const questionPost = {
          ...mockPost,
          content: actionType === 'instruct' ? 'How should I improve?' : 'Regular content',
        };

        const prompt = coachPromptSystem.generateCoachPrompt(
          questionPost,
          coachContext,
          'Test Player'
        );

        expect(prompt.placeholder.toLowerCase()).toContain(expectedText);
      });
    });
  });

  describe('getUpgradePrompts', () => {
    it('returns upgrade prompts for all expertise areas', () => {
      const prompts = coachPromptSystem.getUpgradePrompts();

      expect(prompts).toHaveProperty('technical');
      expect(prompts).toHaveProperty('mental');
      expect(prompts).toHaveProperty('tactical');
      expect(prompts).toHaveProperty('physical');

      expect(prompts.technical).toContain('technical analysis');
      expect(prompts.mental).toContain('mental game');
      expect(prompts.tactical).toContain('tactical insights');
      expect(prompts.physical).toContain('fitness');
    });
  });
});
