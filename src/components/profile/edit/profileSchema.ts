
import { z } from 'zod';

// Define achievement schema
export const achievementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  date_achieved: z.string().optional(),
  description: z.string().optional()
});

// Define certification schema
export const certificationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  issuing_organization: z.string().min(1, 'Organization is required'),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional()
});

// Define schema for form validation
export const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').nonempty('Username is required'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').nonempty('Full name is required'),
  user_type: z.enum(['player', 'coach', 'ambassador'] as const),
  playing_style: z.string().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional'] as const),
  bio: z.string().optional(),
  location_name: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  achievements: z.array(achievementSchema).optional().default([]),
  certifications: z.array(certificationSchema).optional().default([])
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
