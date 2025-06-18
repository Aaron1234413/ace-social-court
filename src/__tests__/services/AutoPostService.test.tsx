
import { AutoPostService } from '@/services/AutoPostService';
import { mockSupabase } from '../mocks/supabase';
import { SessionFormValues } from '@/components/logging/session/sessionSchema';

const mockTemplates = [
  {
    id: 'template-1',
    title: 'Workout Template',
    category: 'workout',
    content_template: 'Had a great training session today working on {focus_area}!',
    placeholders: ['focus_area'],
    is_active: true,
  },
  {
    id: 'template-2',
    title: 'Progress Template',
    category: 'progress',
    content_template: 'Making progress on {technical_focus} - {achievement}!',
    placeholders: ['technical_focus', 'achievement'],
    is_active: true,
  },
];

const mockSessionData: SessionFormValues = {
  session_date: new Date(),
  focus_areas: ['technique_improvement'],
  drills: [{ name: 'forehand practice', rating: 8 }],
  next_steps: [{ description: 'work on consistency' }],
  session_note: 'Great session today',
  physical_data: { 
    energyLevel: 8,
    courtCoverage: 9,
    endurance: 7,
    strengthFeeling: 8
  },
  mental_data: { 
    confidence: 8, 
    motivation: 9,
    emotionEmoji: 'happy',
    anxiety: 3,
    focus: 8
  },
  technical_data: { selectedStrokes: { forehand: true } },
  coach_ids: [],
  notify_coaches: false,
  location: 'Tennis Center',
};

describe('AutoPostService', () => {
  let autoPostService: AutoPostService;

  beforeEach(() => {
    jest.clearAllMocks();
    autoPostService = AutoPostService.getInstance();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = AutoPostService.getInstance();
      const instance2 = AutoPostService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generatePostSuggestions', () => {
    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTemplates,
              error: null,
            }),
          }),
        }),
      });
    });

    it('generates post suggestions successfully', async () => {
      const suggestions = await autoPostService.generatePostSuggestions(
        mockSessionData,
        'user-1'
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toHaveProperty('content');
      expect(suggestions[0]).toHaveProperty('template');
      expect(suggestions[0]).toHaveProperty('confidence');
      expect(suggestions[0]).toHaveProperty('privacyLevel');
    });

    it('renders content with placeholders correctly', async () => {
      const suggestions = await autoPostService.generatePostSuggestions(
        mockSessionData,
        'user-1'
      );

      expect(suggestions[0].content).toContain('technique_improvement');
      expect(suggestions[0].content).not.toContain('{focus_area}');
    });

    it('returns empty array when no templates found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const suggestions = await autoPostService.generatePostSuggestions(
        mockSessionData,
        'user-1'
      );

      expect(suggestions).toHaveLength(0);
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const suggestions = await autoPostService.generatePostSuggestions(
        mockSessionData,
        'user-1'
      );

      expect(suggestions).toHaveLength(0);
    });

    it('selects different templates with rotation', async () => {
      const multipleTemplates = [
        mockTemplates[0],
        { ...mockTemplates[1], category: 'workout' },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: multipleTemplates,
              error: null,
            }),
          }),
        }),
      });

      // Generate suggestions multiple times to test rotation
      const suggestions1 = await autoPostService.generatePostSuggestions(
        mockSessionData,
        'user-1'
      );
      const suggestions2 = await autoPostService.generatePostSuggestions(
        mockSessionData,
        'user-1'
      );

      expect(suggestions1[0].template.id).not.toBe(suggestions2[0].template.id);
    });

    it('calculates confidence based on data completeness', async () => {
      const completeData = {
        ...mockSessionData,
        session_note: 'Detailed note',
        focus_areas: ['technique', 'fitness'],
        drills: [{ name: 'drill1', rating: 8 }, { name: 'drill2', rating: 7 }],
      };

      const minimalData = {
        ...mockSessionData,
        session_note: '',
        focus_areas: undefined,
        drills: undefined,
      };

      const completeSuggestions = await autoPostService.generatePostSuggestions(
        completeData,
        'user-1'
      );
      const minimalSuggestions = await autoPostService.generatePostSuggestions(
        minimalData,
        'user-1'
      );

      expect(completeSuggestions[0].confidence).toBeGreaterThan(
        minimalSuggestions[0].confidence
      );
    });

    it('suggests appropriate privacy level', async () => {
      const dataWithCoaches = {
        ...mockSessionData,
        coach_ids: ['coach-1'],
      };

      const suggestions = await autoPostService.generatePostSuggestions(
        dataWithCoaches,
        'user-1'
      );

      expect(suggestions[0].privacyLevel).toBe('coaches');
    });

    it('determines correct template category', async () => {
      const matchPrepData = {
        ...mockSessionData,
        focus_areas: ['match_preparation'],
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ ...mockTemplates[0], category: 'match' }],
              error: null,
            }),
          }),
        }),
      });

      await autoPostService.generatePostSuggestions(matchPrepData, 'user-1');

      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('category', 'match');
    });
  });

  describe('saveGeneratedPost', () => {
    it('saves post successfully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      const suggestion = {
        id: 'suggestion-1',
        content: 'Generated content',
        template: mockTemplates[0],
        confidence: 0.8,
        sessionId: 'session-1',
        privacyLevel: 'public' as const,
      };

      const result = await autoPostService.saveGeneratedPost(suggestion, 'user-1');

      expect(result).toBe(true);
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        content: 'Generated content',
        privacy_level: 'public',
        template_id: 'template-1',
        is_auto_generated: true,
        engagement_score: 8, // confidence * 10
      });
    });

    it('handles save errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });

      const suggestion = {
        id: 'suggestion-1',
        content: 'Generated content',
        template: mockTemplates[0],
        confidence: 0.8,
        sessionId: 'session-1',
        privacyLevel: 'public' as const,
      };

      const result = await autoPostService.saveGeneratedPost(suggestion, 'user-1');

      expect(result).toBe(false);
    });
  });
});
