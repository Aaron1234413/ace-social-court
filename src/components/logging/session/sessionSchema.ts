
import * as z from "zod";

// Physical pillar data schema
const physicalDataSchema = z.object({
  energyLevel: z.string(),
  courtCoverage: z.number().min(1).max(10),
  endurance: z.number().min(1).max(10),
  strengthFeeling: z.number().min(1).max(10),
  notes: z.string().optional(),
}).optional();

// Mental pillar data schema
const mentalDataSchema = z.object({
  emotionEmoji: z.string(),
  confidence: z.number().min(1).max(10),
  motivation: z.number().min(1).max(10),
  anxiety: z.number().min(1).max(10),
  focus: z.number().min(1).max(10),
  reflection: z.string().optional(),
}).optional();

// Technical pillar data schema
const technicalDataSchema = z.object({
  selectedStrokes: z.record(z.any()),
  notes: z.string().optional(),
  drillSuggestions: z.array(z.string()).optional(),
}).optional();

export const sessionSchema = z.object({
  session_date: z.date({
    required_error: "Session date is required.",
  }),
  coach_id: z.string().optional(),
  participants: z.array(z.string()).default([]),
  focus_areas: z.array(z.string()).min(1, {
    message: "Please select at least one focus area.",
  }),
  drills: z.array(z.object({
    name: z.string().min(1, { message: "Drill name is required." }),
    rating: z.number().min(1).max(5).optional(),
    notes: z.string().optional(),
  })).default([]),
  next_steps: z.array(z.object({
    description: z.string().min(1, { message: "Description is required." }),
    completed: z.boolean().default(false),
  })).default([]),
  session_note: z.string().optional(),
  reminder_date: z.date().optional(),
  // Pillar data fields
  physical_data: physicalDataSchema,
  mental_data: mentalDataSchema,
  technical_data: technicalDataSchema,
  ai_suggestions_used: z.boolean().default(false),
});

export type SessionFormValues = z.infer<typeof sessionSchema>;

// Export individual pillar data types for type safety
export type PhysicalData = z.infer<typeof physicalDataSchema>;
export type MentalData = z.infer<typeof mentalDataSchema>;
export type TechnicalData = z.infer<typeof technicalDataSchema>;
