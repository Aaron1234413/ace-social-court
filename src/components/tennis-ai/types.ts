export interface TennisAIMessage {
  id: string;
  content: string;
  is_from_ai: boolean;
  created_at: string;
}

export interface TennisAIConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface TennisUserPreferences {
  preferred_play_style?: 'aggressive' | 'defensive' | 'all-court' | 'serve-and-volley';
  dominant_hand?: 'right' | 'left';
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  focus_areas?: string[];
  court_surface_preference?: 'hard' | 'clay' | 'grass' | 'indoor';
  training_frequency?: 'daily' | 'weekly' | 'monthly' | 'occasionally';
  age_group?: 'junior' | 'adult' | 'senior';
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  recent_injuries?: string[];
  goals?: string[];
  favorite_pros?: string[];
}

export interface TennisUserProgress {
  skill_assessments: {
    [skillName: string]: {
      rating: number;  // 1-10
      last_assessed: string;
      history: Array<{
        rating: number;
        date: string;
      }>;
    };
  };
  completed_drills: Array<{
    drill_id: string;
    drill_name: string;
    completion_date: string;
    performance_rating?: number; // self-reported 1-10
    notes?: string;
  }>;
  lesson_history: Array<{
    topic: string;
    date: string;
    key_points: string[];
    follow_up_recommended?: string[];
  }>;
}

// New interface for the tennis technique memory
export interface TennisTechniqueMemory {
  id: string;
  user_id: string;
  technique_name: string;
  key_points: string[];
  last_discussed: string;
  discussion_count: number;
  created_at: string;
  updated_at: string;
}

// This will be used for the future personalization feature
export interface TennisAIPersonalization {
  user_id: string;
  preferences: TennisUserPreferences;
  progress: TennisUserProgress;
  created_at: string;
  updated_at: string;
}
