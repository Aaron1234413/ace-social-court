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
          read: boolean
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
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
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name: string | null
          id: string
          playing_style: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string | null
          id: string
          playing_style?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string | null
          id?: string
          playing_style?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_comments_count: {
        Args: { post_id: string }
        Returns: number
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
      has_liked: {
        Args: { user_id: string; post_id: string }
        Returns: boolean
      }
      is_following: {
        Args: { follower_id: string; following_id: string }
        Returns: boolean
      }
    }
    Enums: {
      experience_level:
        | "beginner"
        | "intermediate"
        | "advanced"
        | "professional"
      tag_category:
        | "technique"
        | "match"
        | "training"
        | "equipment"
        | "coaching"
        | "tournament"
      user_type: "player" | "coach"
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
      experience_level: [
        "beginner",
        "intermediate",
        "advanced",
        "professional",
      ],
      tag_category: [
        "technique",
        "match",
        "training",
        "equipment",
        "coaching",
        "tournament",
      ],
      user_type: ["player", "coach"],
    },
  },
} as const
