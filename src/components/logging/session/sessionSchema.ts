
import * as z from "zod";

export const sessionSchema = z.object({
  session_date: z.date({
    required_error: "Session date is required.",
  }),
  coach_id: z.string().optional(),
  participants: z.array(z.string()).optional().default([]),
  focus_areas: z.array(z.string()).min(1, {
    message: "Please select at least one focus area.",
  }),
  drills: z.array(z.object({
    name: z.string().min(1, { message: "Drill name is required." }),
    rating: z.number().min(1).max(5).optional(),
    notes: z.string().optional(),
  })).optional().default([]),
  next_steps: z.array(z.object({
    description: z.string().min(1, { message: "Description is required." }),
    completed: z.boolean().optional().default(false),
  })).optional().default([]),
  session_note: z.string().optional(),
  reminder_date: z.date().optional(),
});

export type SessionFormValues = z.infer<typeof sessionSchema>;
