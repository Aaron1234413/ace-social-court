
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-2',
    title: 'Progress Template',
    category: 'progress',
    content_template: 'Making progress on {technical_focus} - {achievement}!',
    placeholders: ['technical_focus', 'achievement'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: mockTemplates,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);
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
      const mockEmptyQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockEmptyQueryBuilder);

      const suggestions = await autoPostService.generatePostSuggestions(
        mockSessionData,
        'user-1'
      );

      expect(suggestions).toHaveLength(0);
    });

    it('handles database errors gracefully', async () => {
      const mockErrorQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockSupabase.from.mockReturnValue(mockErrorQueryBuilder);

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

      const mockMultipleQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: multipleTemplates,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockMultipleQueryBuilder);

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

      const mockMatchQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: [{ ...mockTemplates[0], category: 'match' }],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockMatchQueryBuilder);

      await autoPostService.generatePostSuggestions(matchPrepData, 'user-1');

      expect(mockMatchQueryBuilder.eq).toHaveBeenCalledWith('category', 'match');
    });
  });

  describe('saveGeneratedPost', () => {
    it('saves post successfully', async () => {
      const mockInsertQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockInsertQueryBuilder);

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
      expect(mockInsertQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        content: 'Generated content',
        privacy_level: 'public',
        template_id: 'template-1',
        is_auto_generated: true,
        engagement_score: 8, // confidence * 10
      });
    });

    it('handles save errors gracefully', async () => {
      const mockErrorInsertQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockErrorInsertQueryBuilder);

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
