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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_scans: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          events_detected: number | null
          id: string
          regions_scanned: number | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          events_detected?: number | null
          id?: string
          regions_scanned?: number | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          events_detected?: number | null
          id?: string
          regions_scanned?: number | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      crop_signals: {
        Row: {
          bbox: number[] | null
          created_at: string
          crop_type: string | null
          event_content: string | null
          event_source: string | null
          event_title: string
          event_url: string | null
          id: string
          published_at: string | null
          region_name: string
          severity: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bbox?: number[] | null
          created_at?: string
          crop_type?: string | null
          event_content?: string | null
          event_source?: string | null
          event_title: string
          event_url?: string | null
          id?: string
          published_at?: string | null
          region_name: string
          severity?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bbox?: number[] | null
          created_at?: string
          crop_type?: string | null
          event_content?: string | null
          event_source?: string | null
          event_title?: string
          event_url?: string | null
          id?: string
          published_at?: string | null
          region_name?: string
          severity?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      intel_reports: {
        Row: {
          confidence: number | null
          generated_at: string
          headline: string
          id: string
          market_implication: string | null
          signal_id: string
          summary: string | null
        }
        Insert: {
          confidence?: number | null
          generated_at?: string
          headline: string
          id?: string
          market_implication?: string | null
          signal_id: string
          summary?: string | null
        }
        Update: {
          confidence?: number | null
          generated_at?: string
          headline?: string
          id?: string
          market_implication?: string | null
          signal_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intel_reports_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "crop_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          report_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          report_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          report_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "intel_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      satellite_analyses: {
        Row: {
          acquisition_date: string | null
          anomaly_score: number | null
          cloud_cover_pct: number | null
          created_at: string
          id: string
          msi_mean: number | null
          ndvi_delta: number | null
          ndvi_mean: number | null
          ndwi_mean: number | null
          signal_id: string
          thumbnail_url: string | null
        }
        Insert: {
          acquisition_date?: string | null
          anomaly_score?: number | null
          cloud_cover_pct?: number | null
          created_at?: string
          id?: string
          msi_mean?: number | null
          ndvi_delta?: number | null
          ndvi_mean?: number | null
          ndwi_mean?: number | null
          signal_id: string
          thumbnail_url?: string | null
        }
        Update: {
          acquisition_date?: string | null
          anomaly_score?: number | null
          cloud_cover_pct?: number | null
          created_at?: string
          id?: string
          msi_mean?: number | null
          ndvi_delta?: number | null
          ndvi_mean?: number | null
          ndwi_mean?: number | null
          signal_id?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "satellite_analyses_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "crop_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_contexts: {
        Row: {
          created_at: string
          date_from: string | null
          date_to: string | null
          drought_index: string | null
          id: string
          precip_anomaly_mm: number | null
          signal_id: string
          soil_moisture_percentile: number | null
          temp_anomaly_c: number | null
        }
        Insert: {
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          drought_index?: string | null
          id?: string
          precip_anomaly_mm?: number | null
          signal_id: string
          soil_moisture_percentile?: number | null
          temp_anomaly_c?: number | null
        }
        Update: {
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          drought_index?: string | null
          id?: string
          precip_anomaly_mm?: number | null
          signal_id?: string
          soil_moisture_percentile?: number | null
          temp_anomaly_c?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_contexts_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "crop_signals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
