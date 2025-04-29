
-- Add location_name column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Update existing locations with a default name based on coordinates
UPDATE public.profiles
SET location_name = CONCAT('Location at ', ROUND(latitude::numeric, 4), ', ', ROUND(longitude::numeric, 4))
WHERE location_name IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
