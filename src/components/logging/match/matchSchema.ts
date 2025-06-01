
import * as z from 'zod';

export const highlightSchema = z.object({
  type: z.enum(['ace', 'winner', 'breakpoint', 'error']),
  note: z.string().optional(),
  timestamp: z.number().optional(),
});

export const matchFormSchema = z.object({
  // Match overview
  match_type: z.enum(['singles', 'doubles']).optional(),
  match_outcome: z.enum(['won', 'lost', 'tie']).optional(),
  partner_name: z.string().optional(),
  opponents_names: z.string().optional(),
  
  // Basic match info
  match_date: z.date(),
  opponent_id: z.string().optional(),
  opponent_name: z.string().optional(),
  location: z.string().optional(),
  surface: z.enum(['hard', 'clay', 'grass', 'other']).optional(),
  score: z.string().optional(),
  
  // Performance ratings
  serve_rating: z.number().min(1).max(5),
  return_rating: z.number().min(1).max(5),
  endurance_rating: z.number().min(1).max(5),
  
  // Highlights
  highlights: z.array(highlightSchema).default([]),
  
  // Mental state and performance
  energy_emoji: z.string().optional(),
  focus_emoji: z.string().optional(),
  emotion_emoji: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Reflection and notes
  reflection_note: z.string().optional(),
  
  // Coach integration
  coach_id: z.string().optional(),
  notify_coach: z.boolean().default(false),
});

export type MatchFormValues = z.infer<typeof matchFormSchema>;
export type HighlightType = z.infer<typeof highlightSchema>;
