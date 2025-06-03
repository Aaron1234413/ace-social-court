
export interface LogPrompt {
  id: string;
  user_id: string;
  prompt_type: string;
  action_taken: string | null;
  created_at: string;
}

// Enhanced match interface with all current fields
export interface Match {
  id: string;
  user_id: string;
  match_date: string;
  
  // Match details
  opponent_id?: string;
  opponent_name?: string;
  location?: string;
  surface?: string;
  surface_type?: string;
  score?: string;
  
  // Match type and outcome
  match_type?: 'singles' | 'doubles';
  match_outcome?: 'won' | 'lost' | 'tie';
  partner_name?: string;
  opponents_names?: string;
  
  // Performance ratings
  serve_rating?: number;
  return_rating?: number;
  endurance_rating?: number;
  
  // Mental state tracking
  energy_emoji?: string;
  energy_emoji_type?: string;
  focus_emoji?: string;
  focus_emoji_type?: string;
  emotion_emoji?: string;
  emotion_emoji_type?: string;
  
  // Additional data
  highlights?: MatchHighlight[];
  tags?: string[];
  reflection_note?: string;
  
  // Coach integration
  coach_id?: string;
  coach_notes?: string;
  notify_coach?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  opponent?: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  } | null;
}

export interface MatchHighlight {
  type: 'ace' | 'breakpoint' | 'winner' | 'error';
  note?: string;
  timestamp?: number;
}

// Standalone pillar data type exports
export interface PhysicalData {
  energyLevel: string;
  courtCoverage: number;
  endurance: number;
  strengthFeeling: number;
  notes?: string;
}

export interface MentalData {
  emotionEmoji: string;
  confidence: number;
  motivation: number;
  anxiety: number;
  focus: number;
  reflection?: string;
}

export interface TechnicalData {
  selectedStrokes: Record<string, any>;
  notes?: string;
  drillSuggestions?: string[];
}

// Enhanced session interface with multiple coaches and pillar data
export interface Session {
  id: string;
  user_id: string;
  coach_id?: string;
  // New fields for multiple coaches
  coach_ids?: string[];
  notify_coaches?: boolean;
  shared_with_coaches?: string[];
  session_date: string;
  location?: string;
  focus_areas?: string[];
  drills?: SessionDrill[];
  next_steps?: SessionNextStep[];
  session_note?: string;
  reminder_date?: string;
  
  // Pillar data stored as JSONB
  physical_data?: PhysicalData;
  mental_data?: MentalData;
  technical_data?: TechnicalData;
  
  // AI integration
  ai_suggestions_used?: boolean;
  
  // Status and metadata
  status?: 'Scheduled' | 'Logged' | 'Completed';
  signed_off?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  coach?: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  } | null;
  coaches?: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  }[];
  participants?: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  }[];
}

export interface SessionDrill {
  name: string;
  rating?: number;
  notes?: string;
}

export interface SessionNextStep {
  description: string;
  completed?: boolean;
}

// Pillar data interfaces for type safety
export interface PillarData {
  physical?: PhysicalData;
  mental?: MentalData;
  technical?: TechnicalData;
}

// Energy and emotion options for consistency
export const ENERGY_OPTIONS = {
  strong: { emoji: '💪', label: 'Strong' },
  intense: { emoji: '🔥', label: 'Intense' },
  drained: { emoji: '😫', label: 'Drained' },
  neutral: { emoji: '😐', label: 'Neutral' }
} as const;

export const EMOTION_OPTIONS = {
  focused: { emoji: '🎯', label: 'Focused' },
  determined: { emoji: '😤', label: 'Determined' },
  anxious: { emoji: '😰', label: 'Anxious' },
  happy: { emoji: '😊', label: 'Happy' },
  fired_up: { emoji: '🔥', label: 'Fired Up' }
} as const;

export const PILLARS_CONFIG = {
  physical: {
    title: 'PHYSICAL',
    emoji: '💪',
    gradient: 'from-red-500 to-orange-500',
    bgGradient: 'from-red-50 to-orange-50'
  },
  mental: {
    title: 'MENTAL', 
    emoji: '🧠',
    gradient: 'from-blue-500 to-purple-500',
    bgGradient: 'from-blue-50 to-purple-50'
  },
  technical: {
    title: 'TECHNICAL',
    emoji: '🎾', 
    gradient: 'from-green-500 to-teal-500',
    bgGradient: 'from-green-50 to-teal-50'
  }
} as const;

export type EnergyType = keyof typeof ENERGY_OPTIONS;
export type EmotionType = keyof typeof EMOTION_OPTIONS;
export type PillarType = keyof typeof PILLARS_CONFIG;
