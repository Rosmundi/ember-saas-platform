export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      post_snapshots: {
        Row: {
          analysis: Json | null
          id: string
          posts_data: Json
          scraped_at: string | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          id?: string
          posts_data: Json
          scraped_at?: string | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          id?: string
          posts_data?: Json
          scraped_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_profile: Json | null
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          onboarding_completed: boolean
          plan: string
          raw_profile_data: Json | null
          role: string | null
          scrapes_daily_limit: number
          scrapes_reset_at: string | null
          scrapes_used_today: number
          searches_daily_limit: number
          searches_reset_at: string
          searches_used_today: number
          skill_runs_limit: number
          skill_runs_reset_at: string | null
          skill_runs_used: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          target_audience: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          watchlist_max_items: number
        }
        Insert: {
          business_profile?: Json | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean
          plan?: string
          raw_profile_data?: Json | null
          role?: string | null
          scrapes_daily_limit?: number
          scrapes_reset_at?: string | null
          scrapes_used_today?: number
          searches_daily_limit?: number
          searches_reset_at?: string
          searches_used_today?: number
          skill_runs_limit?: number
          skill_runs_reset_at?: string | null
          skill_runs_used?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          target_audience?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          watchlist_max_items?: number
        }
        Update: {
          business_profile?: Json | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean
          plan?: string
          raw_profile_data?: Json | null
          role?: string | null
          scrapes_daily_limit?: number
          scrapes_reset_at?: string | null
          scrapes_used_today?: number
          searches_daily_limit?: number
          searches_reset_at?: string
          searches_used_today?: number
          skill_runs_limit?: number
          skill_runs_reset_at?: string | null
          skill_runs_used?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          target_audience?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          watchlist_max_items?: number
        }
        Relationships: []
      }
      prospect_list_items: {
        Row: {
          added_at: string
          list_id: string
          note: string | null
          prospect_id: string
        }
        Insert: {
          added_at?: string
          list_id: string
          note?: string | null
          prospect_id: string
        }
        Update: {
          added_at?: string
          list_id?: string
          note?: string | null
          prospect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "prospect_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_list_items_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_lists: {
        Row: {
          created_at: string
          description: string | null
          icp_snapshot: Json | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icp_snapshot?: Json | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icp_snapshot?: Json | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          created_at: string
          enriched_at: string | null
          full_data: Json | null
          id: string
          linkedin_url: string
          short_data: Json
          source_search_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enriched_at?: string | null
          full_data?: Json | null
          id?: string
          linkedin_url: string
          short_data: Json
          source_search_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enriched_at?: string | null
          full_data?: Json | null
          id?: string
          linkedin_url?: string
          short_data?: Json
          source_search_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skill_runs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input: Json
          is_scrape: boolean | null
          output: Json | null
          skill: string
          status: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input?: Json
          is_scrape?: boolean | null
          output?: Json | null
          skill: string
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input?: Json
          is_scrape?: boolean | null
          output?: Json | null
          skill?: string
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      watchlist: {
        Row: {
          azienda: string | null
          created_at: string | null
          headline: string | null
          id: string
          last_scraped_at: string | null
          last_snapshot: Json | null
          linkedin_url: string
          nome: string | null
          user_id: string
        }
        Insert: {
          azienda?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          last_scraped_at?: string | null
          last_snapshot?: Json | null
          linkedin_url: string
          nome?: string | null
          user_id: string
        }
        Update: {
          azienda?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string
          last_scraped_at?: string | null
          last_snapshot?: Json | null
          linkedin_url?: string
          nome?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_profile_if_missing: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      consume_search_quota: { Args: { p_user_id: string }; Returns: Json }
      reset_daily_scrapes: { Args: never; Returns: undefined }
      reset_scrape_quota_if_due: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      reset_searches_quota_if_due: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      reset_skill_runs_if_due: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
