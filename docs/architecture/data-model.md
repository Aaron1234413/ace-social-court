
# Data Model & Database Schema

## 🗃️ Database Overview

The application uses PostgreSQL through Supabase with comprehensive Row Level Security (RLS) policies. The schema is designed to support a tennis social platform with multiple user types, rich social features, and AI-powered content.

## 👥 User Management

### Core User Tables
```sql
-- Main user profiles
profiles (
  id uuid PRIMARY KEY,                    -- References auth.users
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  user_type user_type_enum,              -- 'player', 'coach', 'ambassador'
  experience_level experience_enum,
  skill_level text,
  location_name text,
  latitude/longitude double precision,    -- Geospatial data
  location_privacy jsonb,                 -- Privacy settings
  is_ai_user boolean,                     -- AI ambassador flag
  roles text[],                           -- Multi-role support
  current_active_role text
)

-- Role-based permissions
user_roles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  role app_role_enum,                     -- 'admin', 'moderator', 'user'
  assigned_at timestamp,
  assigned_by uuid
)

-- Social connections
followers (
  id uuid PRIMARY KEY,
  follower_id uuid,
  following_id uuid,
  created_at timestamp
)
```

### User Types & Roles
- **Player**: Regular tennis players tracking progress
- **Coach**: Tennis instructors with additional permissions
- **Ambassador**: AI-generated personalities for content
- **Admin**: Platform administrators

## 🎾 Tennis-Specific Data

### Session & Match Tracking
```sql
-- Training sessions
sessions (
  id uuid PRIMARY KEY,
  user_id uuid,
  coach_ids uuid[],                       -- Multiple coach support
  session_date date,
  location text,
  focus_areas text[],
  drills jsonb,                           -- [{ name, rating, notes }]
  next_steps jsonb,                       -- [{ description }]
  physical_data jsonb,                    -- Energy, endurance metrics
  mental_data jsonb,                      -- Confidence, motivation
  technical_data jsonb,                   -- Stroke improvements
  session_note text,
  notify_coaches boolean
)

-- Competitive matches
matches (
  id uuid PRIMARY KEY,
  user_id uuid,
  opponent_id uuid,
  coach_id uuid,
  match_date date,
  location text,
  surface_type text,
  score text,
  highlights jsonb,                       -- Key moments
  serve_rating smallint,
  return_rating smallint,
  endurance_rating smallint,
  reflection_note text,
  energy_emoji text,
  focus_emoji text,
  emotion_emoji text,
  tags text[]
)

-- Tennis courts database
tennis_courts (
  id uuid PRIMARY KEY,
  name text,
  description text,
  latitude/longitude double precision,
  address text,
  city text,
  state text,
  surface_type text,
  number_of_courts integer,
  is_public boolean,
  has_lighting boolean,
  is_indoor boolean,
  rating numeric,
  created_by uuid,
  is_approved boolean
)
```

### User Progress & Achievements
```sql
-- User achievements
achievements (
  id uuid PRIMARY KEY,
  user_id uuid,
  title text,
  description text,
  date_achieved timestamp
)

-- Professional certifications
certifications (
  id uuid PRIMARY KEY,
  user_id uuid,
  title text,
  issuing_organization text,
  issue_date date,
  expiry_date date
)

-- Tennis preferences
tennis_user_preferences (
  id uuid PRIMARY KEY,
  user_id uuid,
  preferred_play_style text,
  dominant_hand text,
  experience_level text,
  focus_areas text[],
  court_surface_preference text,
  training_frequency text,
  goals text[],
  favorite_pros text[]
)
```

## 📱 Social Features

### Content & Engagement
```sql
-- User posts
posts (
  id uuid PRIMARY KEY,
  user_id uuid,
  content text,
  media_url text,
  media_type text,
  privacy_level privacy_enum,             -- 'public', 'private', 'coaches'
  template_id uuid,                       -- Auto-generated posts
  is_auto_generated boolean,
  is_ambassador_content boolean,          -- AI content flag
  engagement_score integer,
  created_at timestamp
)

-- Post reactions (Love, Fire, Tip, Achievement)
post_reactions (
  id uuid PRIMARY KEY,
  post_id uuid,
  user_id uuid,
  reaction_type text,                     -- 'love', 'fire', 'tip', 'achievement'
  comment_content text,                   -- Optional tip content
  has_comment boolean,
  created_at timestamp
)

-- Traditional likes (deprecated in favor of reactions)
likes (
  id uuid PRIMARY KEY,
  user_id uuid,
  post_id uuid,
  created_at timestamp
)

-- Comments on posts
comments (
  id uuid PRIMARY KEY,
  user_id uuid,
  post_id uuid,
  content text,
  created_at timestamp
)
```

### Content Templates & AI
```sql
-- Post generation templates
post_templates (
  id uuid PRIMARY KEY,
  title text,
  category template_category_enum,        -- 'workout', 'progress', 'technique'
  content_template text,                  -- Template with placeholders
  placeholders jsonb,                     -- Available variables
  is_active boolean
)

-- AI ambassador profiles
ambassador_profiles (
  id uuid PRIMARY KEY,
  profile_id uuid,                        -- Links to profiles table
  skill_level text,
  specialization text[],
  coaching_specialties text[],
  personality_traits jsonb,
  conversation_style jsonb,
  response_patterns jsonb,
  posting_schedule jsonb,
  is_active boolean
)
```

## 💬 Communication System

### Messaging
```sql
-- Direct messages
direct_messages (
  id uuid PRIMARY KEY,
  sender_id uuid,
  recipient_id uuid,
  content text,
  media_url text,
  media_type text,
  read boolean,
  is_deleted boolean,
  created_at timestamp
)

-- Message reactions
message_reactions (
  id uuid PRIMARY KEY,
  message_id uuid,
  user_id uuid,
  reaction_type text,
  created_at timestamp
)

-- Conversation metadata
conversations (
  id uuid PRIMARY KEY,
  user1_id uuid,                          -- Always smaller UUID
  user2_id uuid,                          -- Always larger UUID
  last_message_at timestamp
)
```

### Notifications
```sql
-- User notifications
notifications (
  id uuid PRIMARY KEY,
  user_id uuid,                           -- Recipient
  sender_id uuid,                         -- Who triggered it
  type text,                              -- 'like', 'comment', 'follow', etc.
  content text,
  entity_type text,                       -- 'post', 'session', 'match'
  entity_id uuid,                         -- Related object ID
  read boolean,
  created_at timestamp
)
```

## 🤖 AI Features

### Tennis AI Chat
```sql
-- AI conversations
ai_conversations (
  id uuid PRIMARY KEY,
  user_id uuid,
  title text,
  created_at timestamp,
  updated_at timestamp
)

-- AI chat messages
ai_messages (
  id uuid PRIMARY KEY,
  conversation_id uuid,
  content text,
  is_from_ai boolean,
  created_at timestamp
)

-- Tennis technique memory
tennis_technique_memory (
  id uuid PRIMARY KEY,
  user_id uuid,
  technique_name text,
  key_points jsonb,                       -- Learned insights
  last_discussed timestamp,
  discussion_count integer
)
```

### AI User Management
```sql
-- AI user statistics
ai_user_stats (
  id uuid PRIMARY KEY,
  profile_id uuid,
  stat_type text,
  stat_value integer,
  stat_period text,
  updated_at timestamp
)

-- AI user achievements
ai_user_achievements (
  id uuid PRIMARY KEY,
  profile_id uuid,
  title text,
  description text,
  achievement_type text,
  date_achieved date,
  is_featured boolean
)
```

## 📊 Analytics & Engagement

### Metrics Tracking
```sql
-- User engagement metrics
engagement_metrics (
  id uuid PRIMARY KEY,
  user_id uuid,
  metric_type text,
  metric_data jsonb,
  created_at timestamp
)

-- Reaction analytics
reaction_analytics (
  id uuid PRIMARY KEY,
  post_id uuid,
  user_id uuid,
  reaction_type text,
  action text,                            -- 'add', 'remove'
  is_ambassador_content boolean,
  created_at timestamp
)

-- User activity logs
user_activity_logs (
  id uuid PRIMARY KEY,
  user_id uuid,
  action_type text,
  action_details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp
)
```

## 🔐 Security Model

### Row Level Security (RLS)
Every table has RLS enabled with policies that ensure:
- Users can only access their own data
- Coaches can access student data when authorized
- Public content is visible based on privacy settings
- Admins have appropriate elevated access

### Key Security Functions
```sql
-- Check if user has specific role
has_role(_user_id uuid, _role app_role) RETURNS boolean

-- Check if user can access session
can_access_session(user_uuid uuid, coach_uuid uuid) RETURNS boolean

-- Get current user's role
get_current_user_role() RETURNS text

-- Admin check
is_admin() RETURNS boolean
```

## 🌐 Geospatial Features

### Location Functions
```sql
-- Calculate distance between coordinates
calculate_distance_miles(lat1, long1, lat2, long2) RETURNS double precision

-- Find nearby users
find_nearby_users(user_lat, user_lng, distance_miles, show_players, show_coaches)

-- Find nearby courts
find_nearby_courts(user_lat, user_lng, distance_miles)
```

### Privacy Controls
Location data includes privacy settings:
- `showOnMap`: Whether user appears on map
- `shareExactLocation`: Precise vs approximate coordinates
- `locationHistory`: Whether to track location over time

## 📈 Data Relationships

### Key Foreign Key Relationships
- All user data references `auth.users(id)`
- Social connections through `followers` table
- Posts link to users and can reference templates
- Sessions can have multiple coaches via array
- Messages create conversations between users
- Notifications link entities across tables

### Constraints & Indexes
- Unique constraints on username, conversation pairs
- Geospatial indexes for location queries
- Composite indexes for feed queries
- Partial indexes for active content

This data model supports a comprehensive tennis social platform with rich user interactions, detailed performance tracking, AI-powered features, and robust privacy controls.
