export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          date_achieved: string | null
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_achieved?: string | null
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_achieved?: string | null
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_from_ai: boolean
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_from_ai?: boolean
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_from_ai?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          posting_schedule: Json | null
          profile_id: string
          skill_level: string
          specialization: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          posting_schedule?: Json | null
          profile_id: string
          skill_level: string
          specialization?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          posting_schedule?: Json | null
          profile_id?: string
          skill_level?: string
          specialization?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          media_type: string | null
          media_url: string | null
          read: boolean
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          media_type?: string | null
          media_url?: string | null
          read?: boolean
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          media_type?: string | null
          media_url?: string | null
          read?: boolean
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_recipient_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_sender_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      log_prompts: {
        Row: {
          action_taken: string | null
          created_at: string | null
          id: string
          prompt_type: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          id?: string
          prompt_type: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          id?: string
          prompt_type?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          coach_id: string | null
          coach_notes: string | null
          created_at: string | null
          emotion_emoji: string | null
          emotion_emoji_type: string | null
          endurance_rating: number | null
          energy_emoji: string | null
          energy_emoji_type: string | null
          focus_emoji: string | null
          focus_emoji_type: string | null
          highlights: Json | null
          id: string
          location: string | null
          match_date: string
          media_type: string | null
          media_url: string | null
          notify_coach: boolean | null
          opponent_id: string | null
          reflection_note: string | null
          return_rating: number | null
          score: string | null
          serve_rating: number | null
          surface: string | null
          surface_type: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          coach_notes?: string | null
          created_at?: string | null
          emotion_emoji?: string | null
          emotion_emoji_type?: string | null
          endurance_rating?: number | null
          energy_emoji?: string | null
          energy_emoji_type?: string | null
          focus_emoji?: string | null
          focus_emoji_type?: string | null
          highlights?: Json | null
          id?: string
          location?: string | null
          match_date?: string
          media_type?: string | null
          media_url?: string | null
          notify_coach?: boolean | null
          opponent_id?: string | null
          reflection_note?: string | null
          return_rating?: number | null
          score?: string | null
          serve_rating?: number | null
          surface?: string | null
          surface_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coach_id?: string | null
          coach_notes?: string | null
          created_at?: string | null
          emotion_emoji?: string | null
          emotion_emoji_type?: string | null
          endurance_rating?: number | null
          energy_emoji?: string | null
          energy_emoji_type?: string | null
          focus_emoji?: string | null
          focus_emoji_type?: string | null
          highlights?: Json | null
          id?: string
          location?: string | null
          match_date?: string
          media_type?: string | null
          media_url?: string | null
          notify_coach?: boolean | null
          opponent_id?: string | null
          reflection_note?: string | null
          return_rating?: number | null
          score?: string | null
          serve_rating?: number | null
          surface?: string | null
          surface_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read: boolean
          sender_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          sender_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          sender_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      post_templates: {
        Row: {
          category: Database["public"]["Enums"]["template_category"]
          content_template: string
          created_at: string | null
          id: string
          is_active: boolean | null
          placeholders: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["template_category"]
          content_template: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          placeholders?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["template_category"]
          content_template?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          placeholders?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string
          engagement_score: number | null
          flag_reason: string | null
          id: string
          is_ambassador_content: boolean | null
          is_auto_generated: boolean | null
          is_fallback_content: boolean | null
          is_flagged: boolean | null
          media_type: string | null
          media_url: string | null
          privacy_level: Database["public"]["Enums"]["privacy_level"] | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          engagement_score?: number | null
          flag_reason?: string | null
          id?: string
          is_ambassador_content?: boolean | null
          is_auto_generated?: boolean | null
          is_fallback_content?: boolean | null
          is_flagged?: boolean | null
          media_type?: string | null
          media_url?: string | null
          privacy_level?: Database["public"]["Enums"]["privacy_level"] | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          engagement_score?: number | null
          flag_reason?: string | null
          id?: string
          is_ambassador_content?: boolean | null
          is_auto_generated?: boolean | null
          is_fallback_content?: boolean | null
          is_flagged?: boolean | null
          media_type?: string | null
          media_url?: string | null
          privacy_level?: Database["public"]["Enums"]["privacy_level"] | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "post_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          assigned_coach_id: string | null
          avatar_url: string | null
          bio: string | null
          cover_photo_url: string | null
          created_at: string
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name: string | null
          id: string
          latitude: number | null
          location_name: string | null
          location_privacy: Json | null
          location_updated_at: string | null
          longitude: number | null
          playing_style: string | null
          skill_level: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
        }
        Insert: {
          assigned_coach_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string | null
          id: string
          latitude?: number | null
          location_name?: string | null
          location_privacy?: Json | null
          location_updated_at?: string | null
          longitude?: number | null
          playing_style?: string | null
          skill_level?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
        }
        Update: {
          assigned_coach_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          location_privacy?: Json | null
          location_updated_at?: string | null
          longitude?: number | null
          playing_style?: string | null
          skill_level?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_coach_id_fkey"
            columns: ["assigned_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reaction_analytics: {
        Row: {
          action: string
          created_at: string
          id: string
          is_ambassador_content: boolean | null
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          is_ambassador_content?: boolean | null
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          is_ambassador_content?: boolean | null
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          created_at: string
          id: string
          player_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          ai_suggestions_used: boolean | null
          coach_id: string | null
          coach_ids: string[] | null
          created_at: string | null
          drills: Json | null
          focus_areas: string[] | null
          id: string
          location: string | null
          mental_data: Json | null
          next_steps: Json | null
          notify_coaches: boolean | null
          physical_data: Json | null
          reminder_date: string | null
          session_date: string
          session_note: string | null
          shared_with_coaches: string[] | null
          signed_off: boolean | null
          status: Database["public"]["Enums"]["session_status_enum"] | null
          technical_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_suggestions_used?: boolean | null
          coach_id?: string | null
          coach_ids?: string[] | null
          created_at?: string | null
          drills?: Json | null
          focus_areas?: string[] | null
          id?: string
          location?: string | null
          mental_data?: Json | null
          next_steps?: Json | null
          notify_coaches?: boolean | null
          physical_data?: Json | null
          reminder_date?: string | null
          session_date?: string
          session_note?: string | null
          shared_with_coaches?: string[] | null
          signed_off?: boolean | null
          status?: Database["public"]["Enums"]["session_status_enum"] | null
          technical_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_suggestions_used?: boolean | null
          coach_id?: string | null
          coach_ids?: string[] | null
          created_at?: string | null
          drills?: Json | null
          focus_areas?: string[] | null
          id?: string
          location?: string | null
          mental_data?: Json | null
          next_steps?: Json | null
          notify_coaches?: boolean | null
          physical_data?: Json | null
          reminder_date?: string | null
          session_date?: string
          session_note?: string | null
          shared_with_coaches?: string[] | null
          signed_off?: boolean | null
          status?: Database["public"]["Enums"]["session_status_enum"] | null
          technical_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          category: Database["public"]["Enums"]["tag_category"] | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["tag_category"] | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["tag_category"] | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tennis_courts: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          has_lighting: boolean | null
          has_pro_shop: boolean | null
          has_restrooms: boolean | null
          id: string
          is_approved: boolean | null
          is_indoor: boolean | null
          is_public: boolean | null
          latitude: number
          longitude: number
          name: string
          number_of_courts: number | null
          rating: number | null
          state: string | null
          surface_type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          has_lighting?: boolean | null
          has_pro_shop?: boolean | null
          has_restrooms?: boolean | null
          id?: string
          is_approved?: boolean | null
          is_indoor?: boolean | null
          is_public?: boolean | null
          latitude: number
          longitude: number
          name: string
          number_of_courts?: number | null
          rating?: number | null
          state?: string | null
          surface_type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          has_lighting?: boolean | null
          has_pro_shop?: boolean | null
          has_restrooms?: boolean | null
          id?: string
          is_approved?: boolean | null
          is_indoor?: boolean | null
          is_public?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          number_of_courts?: number | null
          rating?: number | null
          state?: string | null
          surface_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tennis_technique_memory: {
        Row: {
          created_at: string | null
          discussion_count: number | null
          id: string
          key_points: Json | null
          last_discussed: string | null
          technique_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discussion_count?: number | null
          id?: string
          key_points?: Json | null
          last_discussed?: string | null
          technique_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discussion_count?: number | null
          id?: string
          key_points?: Json | null
          last_discussed?: string | null
          technique_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tennis_user_preferences: {
        Row: {
          age_group: string | null
          court_surface_preference: string | null
          created_at: string
          dominant_hand: string | null
          experience_level: string | null
          favorite_pros: string[] | null
          fitness_level: string | null
          focus_areas: string[] | null
          goals: string[] | null
          id: string
          preferred_play_style: string | null
          recent_injuries: string[] | null
          training_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          court_surface_preference?: string | null
          created_at?: string
          dominant_hand?: string | null
          experience_level?: string | null
          favorite_pros?: string[] | null
          fitness_level?: string | null
          focus_areas?: string[] | null
          goals?: string[] | null
          id?: string
          preferred_play_style?: string | null
          recent_injuries?: string[] | null
          training_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          court_surface_preference?: string | null
          created_at?: string
          dominant_hand?: string | null
          experience_level?: string | null
          favorite_pros?: string[] | null
          fitness_level?: string | null
          focus_areas?: string[] | null
          goals?: string[] | null
          id?: string
          preferred_play_style?: string | null
          recent_injuries?: string[] | null
          training_frequency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tennis_user_progress: {
        Row: {
          completed_drills: Json | null
          created_at: string
          id: string
          lesson_history: Json | null
          skill_assessments: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_drills?: Json | null
          created_at?: string
          id?: string
          lesson_history?: Json | null
          skill_assessments?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_drills?: Json | null
          created_at?: string
          id?: string
          lesson_history?: Json | null
          skill_assessments?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_analyses: {
        Row: {
          created_at: string | null
          id: string
          recommended_drills: string[] | null
          status: string
          summary: string | null
          techniques: Json | null
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recommended_drills?: string[] | null
          status?: string
          summary?: string | null
          techniques?: Json | null
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recommended_drills?: string[] | null
          status?: string
          summary?: string | null
          techniques?: Json | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance_miles: {
        Args: { lat1: number; long1: number; lat2: number; long2: number }
        Returns: number
      }
      can_access_session: {
        Args: { user_uuid: string; coach_uuid: string }
        Returns: boolean
      }
      find_nearby_courts: {
        Args: { user_lat: number; user_lng: number; distance_miles?: number }
        Returns: {
          id: string
          name: string
          description: string
          latitude: number
          longitude: number
          address: string
          city: string
          state: string
          country: string
          surface_type: string
          distance: number
          is_public: boolean
        }[]
      }
      find_nearby_users: {
        Args: {
          user_lat: number
          user_lng: number
          distance_miles: number
          show_players?: boolean
          show_coaches?: boolean
        }
        Returns: {
          id: string
          full_name: string
          username: string
          avatar_url: string
          user_type: string
          distance: number
          latitude: number
          longitude: number
        }[]
      }
      get_comments_count: {
        Args: { post_id: string }
        Returns: number
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_followers_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_following_count: {
        Args: { user_id: string }
        Returns: number
      }
      get_likes_count: {
        Args: { post_id: string }
        Returns: number
      }
      get_post_reaction_counts: {
        Args: { post_id: string }
        Returns: {
          love_count: number
          fire_count: number
          tip_count: number
          achievement_count: number
        }[]
      }
      get_top_reacted_posts: {
        Args: { days_back: number; limit_count: number }
        Returns: {
          post_id: string
          total_reactions: number
          content_preview: string
        }[]
      }
      has_liked: {
        Args: { user_id: string; post_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_following: {
        Args: { follower_id: string; following_id: string }
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          _user_id: string
          _action_type: string
          _action_details?: Json
          _ip_address?: string
          _user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      experience_level:
        | "beginner"
        | "intermediate"
        | "advanced"
        | "professional"
      privacy_level:
        | "private"
        | "friends"
        | "public"
        | "coaches"
        | "public_highlights"
      session_status_enum: "Scheduled" | "In Progress" | "Logged" | "Signed Off"
      tag_category:
        | "technique"
        | "match"
        | "training"
        | "equipment"
        | "coaching"
        | "tournament"
      template_category:
        | "workout"
        | "match"
        | "progress"
        | "motivation"
        | "technique"
      user_type: "player" | "coach" | "ambassador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      experience_level: [
        "beginner",
        "intermediate",
        "advanced",
        "professional",
      ],
      privacy_level: [
        "private",
        "friends",
        "public",
        "coaches",
        "public_highlights",
      ],
      session_status_enum: ["Scheduled", "In Progress", "Logged", "Signed Off"],
      tag_category: [
        "technique",
        "match",
        "training",
        "equipment",
        "coaching",
        "tournament",
      ],
      template_category: [
        "workout",
        "match",
        "progress",
        "motivation",
        "technique",
      ],
      user_type: ["player", "coach", "ambassador"],
    },
  },
} as const
