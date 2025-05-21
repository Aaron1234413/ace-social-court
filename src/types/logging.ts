
export interface LogPrompt {
  id: string;
  user_id: string;
  prompt_type: string;
  action_taken: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  opponent_id?: string;
  match_date: string;
  surface?: string;
  location?: string;
  score?: string;
  serve_rating?: number;
  return_rating?: number;
  endurance_rating?: number;
  highlights?: MatchHighlight[];
  reflection_note?: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  updated_at: string;
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

export interface Session {
  id: string;
  user_id: string;
  coach_id?: string;
  session_date: string;
  focus_areas?: string[];
  drills?: SessionDrill[];
  next_steps?: SessionNextStep[];
  session_note?: string;
  reminder_date?: string;
  created_at: string;
  updated_at: string;
  coach?: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  } | null;
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
