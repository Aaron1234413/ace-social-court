import { z } from 'zod';
import { PhysicalData, MentalData, TechnicalData } from '@/types/logging';

// Session form validation schema
export const sessionFormSchema = z.object({
  session_date: z.date({
    required_error: "Session date is required",
  }),
  coach_id: z.string().uuid().optional(),
  // New fields for multiple coaches
  coach_ids: z.array(z.string().uuid()).optional().default([]),
  notify_coaches: z.boolean().optional().default(false),
  shared_with_coaches: z.array(z.string().uuid()).optional().default([]),
  // Existing fields
  participants: z.array(z.string().uuid()).optional(),
  focus_areas: z.array(z.string()).min(1, "At least one focus area is required"),
  drills: z.array(z.object({
    name: z.string().min(1, "Drill name is required"),
    rating: z.number().min(1).max(5).optional(),
    notes: z.string().optional(),
  })).optional().default([]),
  next_steps: z.array(z.object({
    description: z.string().min(1, "Step description is required"),
    completed: z.boolean().optional().default(false),
  })).optional().default([]),
  session_note: z.string().optional(),
  reminder_date: z.date().optional(),
  // Pillar data
  physical_data: z.custom<PhysicalData>().optional(),
  mental_data: z.custom<MentalData>().optional(),
  technical_data: z.custom<TechnicalData>().optional(),
  ai_suggestions_used: z.boolean().optional().default(false),
});

export type SessionFormValues = z.infer<typeof sessionFormSchema>;
