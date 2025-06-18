
import { AlertEngine, AlertThresholds, StudentAlert } from '@/services/AlertEngine';
import { mockSupabase } from '../mocks/supabase';

const mockStudents = [
  {
    id: 'student-1',
    full_name: 'John Doe',
    username: 'johndoe',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
  {
    id: 'student-2',
    full_name: 'Jane Smith',
    username: 'janesmith',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
];

const mockSessions = [
  {
    session_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
];

describe('AlertEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateThresholds', () => {
    it('calculates thresholds for small rosters', () => {
      const thresholds = AlertEngine.calculateThresholds(3);
      
      expect(thresholds).toEqual({
        rosterSize: 3,
        missedSessionThreshold: 1,
        neverPostedThreshold: 7,
        consecutiveThreshold: 2,
      });
    });

    it('calculates thresholds for medium rosters', () => {
      const thresholds = AlertEngine.calculateThresholds(8);
      
      expect(thresholds).toEqual({
        rosterSize: 8,
        missedSessionThreshold: 2,
        neverPostedThreshold: 7,
        consecutiveThreshold: 2,
      });
    });

    it('calculates thresholds for large rosters', () => {
      const thresholds = AlertEngine.calculateThresholds(12);
      
      expect(thresholds).toEqual({
        rosterSize: 12,
        missedSessionThreshold: 3,
        neverPostedThreshold: 7,
        consecutiveThreshold: 2,
      });
    });
  });

  describe('generateAlerts', () => {
    beforeEach(() => {
      // Mock students query with complete query builder
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
          data: mockStudents,
          error: null,
        }),
      };
      
      mockSupabase.from.mockReturnValue(mockQueryBuilder);
    });

    it('generates alerts for students successfully', async () => {
      // Mock sessions queries with complete query builder
      const mockSessionsQueryBuilder = {
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

      mockSupabase.from.mockReturnValue(mockSessionsQueryBuilder);

      const result = await AlertEngine.generateAlerts('coach-1');

      expect(result.alerts).toBeDefined();
      expect(result.thresholds).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalStudents).toBe(2);
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
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockErrorQueryBuilder);

      await expect(AlertEngine.generateAlerts('coach-1')).rejects.toThrow();
    });

    it('generates never posted alerts for new users', async () => {
      const newStudent = {
        ...mockStudents[0],
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      };

      const mockNewStudentQueryBuilder = {
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
          data: [newStudent],
          error: null,
        }),
      };

      const mockSessionsQueryBuilder = {
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

      mockSupabase.from
        .mockReturnValueOnce(mockNewStudentQueryBuilder)
        .mockReturnValue(mockSessionsQueryBuilder);

      const result = await AlertEngine.generateAlerts('coach-1');

      const neverPostedAlert = result.alerts.find(a => a.alertType === 'never_posted');
      expect(neverPostedAlert).toBeDefined();
      expect(neverPostedAlert?.severity).toBe('high');
    });
  });

  describe('getThresholdExplanation', () => {
    it('explains thresholds for small groups', () => {
      const thresholds: AlertThresholds = {
        rosterSize: 3,
        missedSessionThreshold: 1,
        neverPostedThreshold: 7,
        consecutiveThreshold: 2,
      };

      const explanation = AlertEngine.getThresholdExplanation(thresholds);
      expect(explanation).toContain('small');
      expect(explanation).toContain('1 missed session');
    });

    it('explains thresholds for large groups', () => {
      const thresholds: AlertThresholds = {
        rosterSize: 12,
        missedSessionThreshold: 3,
        neverPostedThreshold: 7,
        consecutiveThreshold: 2,
      };

      const explanation = AlertEngine.getThresholdExplanation(thresholds);
      expect(explanation).toContain('larger groups');
      expect(explanation).toContain('3 missed sessions');
    });
  });
});
