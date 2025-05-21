
import * as z from 'zod';

export const highlightSchema = z.object({
  type: z.enum(['ace', 'winner', 'breakpoint', 'error']),
  note: z.string().optional(),
  timestamp: z.number().optional(),
});

export const matchFormSchema = z.object({
  opponent_id: z.string().optional(),
  opponent_name: z.string().optional(),
  match_date: z.date(),
  surface: z.string().optional(),
  location: z.string().optional(),
  score: z.string().optional(),
  highlights: z.array(highlightSchema).default([]),
  serve_rating: z.number().min(1).max(5),
  return_rating: z.number().min(1).max(5),
  endurance_rating: z.number().min(1).max(5),
  reflection_note: z.string().optional(),
  media_url: z.string().optional(),
  media_type: z.string().optional(),
});

export type MatchFormValues = z.infer<typeof matchFormSchema>;
export type HighlightType = z.infer<typeof highlightSchema>;
