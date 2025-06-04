
import { supabase } from '@/integrations/supabase/client';

export interface StudentAlert {
  id: string;
  studentId: string;
  studentName: string;
  alertType: 'missed_sessions' | 'never_posted' | 'consecutive_missed';
  severity: 'low' | 'medium' | 'high';
  missedCount: number;
  lastActivity?: string;
  daysSinceRegistration?: number;
  suggestedActions: string[];
}

export interface AlertThresholds {
  rosterSize: number;
  missedSessionThreshold: number;
  neverPostedThreshold: number;
  consecutiveThreshold: number;
}

export class AlertEngine {
  static calculateThresholds(rosterSize: number): AlertThresholds {
    let missedSessionThreshold = 1; // Default for small rosters
    
    if (rosterSize >= 10) {
      missedSessionThreshold = 3;
    } else if (rosterSize >= 7) {
      missedSessionThreshold = 2;
    }
    
    return {
      rosterSize,
      missedSessionThreshold,
      neverPostedThreshold: 7, // days
      consecutiveThreshold: 2 // consecutive sessions
    };
  }

  static async generateAlerts(coachId: string): Promise<{
    alerts: StudentAlert[];
    thresholds: AlertThresholds;
    summary: {
      totalStudents: number;
      activeStudents: number;
      atRiskStudents: number;
    };
  }> {
    // Get all students assigned to this coach
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, created_at')
      .eq('assigned_coach_id', coachId);

    if (error || !students) {
      throw error || new Error('Failed to fetch students');
    }

    const rosterSize = students.length;
    const thresholds = this.calculateThresholds(rosterSize);
    const alerts: StudentAlert[] = [];
    
    // Get recent session activity for all students
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const student of students) {
      const studentAlerts = await this.analyzeStudentActivity(
        student,
        thresholds,
        oneWeekAgo
      );
      alerts.push(...studentAlerts);
    }

    // Calculate summary
    const activeStudents = students.filter(s => 
      !alerts.some(a => a.studentId === s.id)
    ).length;
    
    const atRiskStudents = alerts.filter(a => 
      a.severity === 'high'
    ).length;

    return {
      alerts: alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      thresholds,
      summary: {
        totalStudents: rosterSize,
        activeStudents,
        atRiskStudents
      }
    };
  }

  private static async analyzeStudentActivity(
    student: any,
    thresholds: AlertThresholds,
    oneWeekAgo: Date
  ): Promise<StudentAlert[]> {
    const alerts: StudentAlert[] = [];
    
    // Check for sessions in the last week
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('session_date, created_at')
      .eq('user_id', student.id)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false });

    // Check for all sessions to analyze patterns
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('session_date, created_at')
      .eq('user_id', student.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const daysSinceRegistration = Math.floor(
      (Date.now() - new Date(student.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Alert 1: Never posted (new users)
    if (!allSessions?.length && daysSinceRegistration >= thresholds.neverPostedThreshold) {
      alerts.push({
        id: `never-posted-${student.id}`,
        studentId: student.id,
        studentName: student.full_name || student.username,
        alertType: 'never_posted',
        severity: 'high',
        missedCount: 0,
        daysSinceRegistration,
        suggestedActions: [
          'Send Welcome Message',
          'Schedule Check-in Call',
          'Share Getting Started Guide'
        ]
      });
    }

    // Alert 2: Missed sessions based on scaled threshold
    const expectedSessions = Math.min(7, daysSinceRegistration); // Assume 1 session per day max
    const actualSessions = recentSessions?.length || 0;
    const missedSessions = Math.max(0, expectedSessions - actualSessions);

    if (missedSessions >= thresholds.missedSessionThreshold && expectedSessions > 0) {
      const severity = missedSessions >= thresholds.missedSessionThreshold * 2 ? 'high' : 'medium';
      
      alerts.push({
        id: `missed-sessions-${student.id}`,
        studentId: student.id,
        studentName: student.full_name || student.username,
        alertType: 'missed_sessions',
        severity,
        missedCount: missedSessions,
        lastActivity: recentSessions?.[0]?.created_at,
        suggestedActions: [
          'Send Gentle Reminder',
          'Check for Obstacles',
          'Offer Support'
        ]
      });
    }

    // Alert 3: Consecutive missed sessions
    if (allSessions?.length) {
      const consecutiveMissed = this.calculateConsecutiveMissed(allSessions);
      
      if (consecutiveMissed >= thresholds.consecutiveThreshold) {
        alerts.push({
          id: `consecutive-missed-${student.id}`,
          studentId: student.id,
          studentName: student.full_name || student.username,
          alertType: 'consecutive_missed',
          severity: consecutiveMissed >= 4 ? 'high' : 'medium',
          missedCount: consecutiveMissed,
          lastActivity: allSessions[0]?.created_at,
          suggestedActions: [
            'Personal Check-in',
            'Adjust Training Plan',
            'Motivational Support'
          ]
        });
      }
    }

    return alerts;
  }

  private static calculateConsecutiveMissed(sessions: any[]): number {
    if (!sessions.length) return 0;
    
    const today = new Date();
    const recentDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const sessionDates = new Set(
      sessions.map(s => s.session_date || s.created_at.split('T')[0])
    );

    let consecutiveMissed = 0;
    for (const day of recentDays) {
      if (!sessionDates.has(day)) {
        consecutiveMissed++;
      } else {
        break;
      }
    }

    return consecutiveMissed;
  }

  static getThresholdExplanation(thresholds: AlertThresholds): string {
    const { rosterSize, missedSessionThreshold } = thresholds;
    
    if (rosterSize < 5) {
      return `Alerts trigger after ${missedSessionThreshold} missed session because your group is small (${rosterSize} students)`;
    } else if (rosterSize >= 10) {
      return `Alerts trigger after ${missedSessionThreshold} missed sessions for larger groups (${rosterSize} students)`;
    } else {
      return `Alerts trigger after ${missedSessionThreshold} missed sessions for medium groups (${rosterSize} students)`;
    }
  }
}
