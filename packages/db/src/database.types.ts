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
      custodian_users: {
        Row: {
          created_at: string
          display_name: string | null
          photo_url: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          photo_url?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          photo_url?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          footer_note: string | null
          headline: string | null
          id: string
          is_active: boolean
          name: string
          paragraphs: string[]
          preheader: string | null
          slug: string
          subject: string
          tenant_id: string | null
          updated_at: string
          variables: string[]
        }
        Insert: {
          category?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          footer_note?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean
          name: string
          paragraphs?: string[]
          preheader?: string | null
          slug: string
          subject: string
          tenant_id?: string | null
          updated_at?: string
          variables?: string[]
        }
        Update: {
          category?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          footer_note?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean
          name?: string
          paragraphs?: string[]
          preheader?: string | null
          slug?: string
          subject?: string
          tenant_id?: string | null
          updated_at?: string
          variables?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_doc_versions: {
        Row: {
          created_at: string
          created_by: string | null
          doc_key: string
          id: string
          intro: string
          published_at: string | null
          sections: Json
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_key: string
          id?: string
          intro?: string
          published_at?: string | null
          sections?: Json
          status?: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_key?: string
          id?: string
          intro?: string
          published_at?: string | null
          sections?: Json
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      patient_alerts: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          patient_id: string
          priority: Database["public"]["Enums"]["alert_priority"]
          resolved_at: string | null
          resolved_by: string | null
          resolved_reason: string | null
          status: string
          tenant_id: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          patient_id: string
          priority?: Database["public"]["Enums"]["alert_priority"]
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          status?: string
          tenant_id: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          patient_id?: string
          priority?: Database["public"]["Enums"]["alert_priority"]
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          status?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_allergies: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          notes: string | null
          patient_id: string
          reaction: string
          reported_by: string | null
          severity: Database["public"]["Enums"]["allergy_severity"]
          status: string
          substance: string
          tenant_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reaction: string
          reported_by?: string | null
          severity: Database["public"]["Enums"]["allergy_severity"]
          status?: string
          substance: string
          tenant_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reaction?: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["allergy_severity"]
          status?: string
          substance?: string
          tenant_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_allergies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_feed_entries: {
        Row: {
          appointment_id: string | null
          consultation_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_url: string | null
          edited_at: string | null
          entry_type: Database["public"]["Enums"]["feed_entry_type"]
          id: string
          patient_id: string
          payload: Json
          related_entry_id: string | null
          status: string
          struck_at: string | null
          struck_by: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          appointment_id?: string | null
          consultation_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_url?: string | null
          edited_at?: string | null
          entry_type: Database["public"]["Enums"]["feed_entry_type"]
          id?: string
          patient_id: string
          payload: Json
          related_entry_id?: string | null
          status?: string
          struck_at?: string | null
          struck_by?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          appointment_id?: string | null
          consultation_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_url?: string | null
          edited_at?: string | null
          entry_type?: Database["public"]["Enums"]["feed_entry_type"]
          id?: string
          patient_id?: string
          payload?: Json
          related_entry_id?: string | null
          status?: string
          struck_at?: string | null
          struck_by?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_feed_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_feed_entries_related_entry_id_fkey"
            columns: ["related_entry_id"]
            isOneToOne: false
            referencedRelation: "patient_feed_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_feed_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          blood_group: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          date_of_birth: string
          deceased_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          emergency_name: string | null
          emergency_phone: string | null
          emergency_relationship: string | null
          ethnicity: string | null
          first_name: string
          gender_identity: string | null
          has_active_alerts: boolean
          id: string
          last_name: string
          nhs_number: string | null
          occupation: string | null
          patient_number: string | null
          phone_landline: string | null
          phone_mobile: string | null
          portal_activated_at: string | null
          portal_invited_at: string | null
          postcode: string | null
          preferred_contact: string
          preferred_name: string | null
          pronouns: string | null
          registered_gp_address: string | null
          registered_gp_name: string | null
          registered_gp_practice: string | null
          sex_at_birth: string
          status: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          blood_group?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          deceased_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relationship?: string | null
          ethnicity?: string | null
          first_name: string
          gender_identity?: string | null
          has_active_alerts?: boolean
          id?: string
          last_name: string
          nhs_number?: string | null
          occupation?: string | null
          patient_number?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          portal_activated_at?: string | null
          portal_invited_at?: string | null
          postcode?: string | null
          preferred_contact?: string
          preferred_name?: string | null
          pronouns?: string | null
          registered_gp_address?: string | null
          registered_gp_name?: string | null
          registered_gp_practice?: string | null
          sex_at_birth: string
          status?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          blood_group?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          deceased_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relationship?: string | null
          ethnicity?: string | null
          first_name?: string
          gender_identity?: string | null
          has_active_alerts?: boolean
          id?: string
          last_name?: string
          nhs_number?: string | null
          occupation?: string | null
          patient_number?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          portal_activated_at?: string | null
          portal_invited_at?: string | null
          postcode?: string | null
          preferred_contact?: string
          preferred_name?: string | null
          pronouns?: string | null
          registered_gp_address?: string | null
          registered_gp_name?: string | null
          registered_gp_practice?: string | null
          sex_at_birth?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          accepted_at: string | null
          access_ends_at: string | null
          access_starts_at: string | null
          created_at: string
          designation: string | null
          display_name: string
          id: string
          invited_at: string | null
          invited_by: string | null
          job_title: string | null
          last_login_at: string | null
          license_number: string | null
          license_type: string | null
          photo_url: string | null
          preferred_name: string | null
          prescribing_rights: boolean
          role: Database["public"]["Enums"]["user_role"]
          specialties: string[] | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          access_ends_at?: string | null
          access_starts_at?: string | null
          created_at?: string
          designation?: string | null
          display_name: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          job_title?: string | null
          last_login_at?: string | null
          license_number?: string | null
          license_type?: string | null
          photo_url?: string | null
          preferred_name?: string | null
          prescribing_rights?: boolean
          role: Database["public"]["Enums"]["user_role"]
          specialties?: string[] | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          access_ends_at?: string | null
          access_starts_at?: string | null
          created_at?: string
          designation?: string | null
          display_name?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          job_title?: string | null
          last_login_at?: string | null
          license_number?: string | null
          license_type?: string | null
          photo_url?: string | null
          preferred_name?: string | null
          prescribing_rights?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          specialties?: string[] | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          activated_at: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          config: Json
          contact_email: string | null
          contact_phone: string | null
          country: string
          cqc_registration: string | null
          created_at: string
          custom_domain: string | null
          his_registration: string | null
          ico_registration: string | null
          id: string
          legal_name: string
          name: string
          onboarding_step: string | null
          patient_number_next: number
          patient_number_prefix: string | null
          postcode: string | null
          slug: string
          status: string
          stripe_customer_id: string | null
          subdomain: string
          subscription_status: string
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          config?: Json
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          cqc_registration?: string | null
          created_at?: string
          custom_domain?: string | null
          his_registration?: string | null
          ico_registration?: string | null
          id?: string
          legal_name: string
          name: string
          onboarding_step?: string | null
          patient_number_next?: number
          patient_number_prefix?: string | null
          postcode?: string | null
          slug: string
          status?: string
          stripe_customer_id?: string | null
          subdomain: string
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          config?: Json
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          cqc_registration?: string | null
          created_at?: string
          custom_domain?: string | null
          his_registration?: string | null
          ico_registration?: string | null
          id?: string
          legal_name?: string
          name?: string
          onboarding_step?: string | null
          patient_number_next?: number
          patient_number_prefix?: string | null
          postcode?: string | null
          slug?: string
          status?: string
          stripe_customer_id?: string | null
          subdomain?: string
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactional_emails: {
        Row: {
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          opened_at: string | null
          provider_message_id: string | null
          rendered_html: string | null
          rendered_text: string | null
          source: string
          status: string
          subject: string
          template_slug: string
          tenant_id: string | null
          to_email: string
          to_name: string | null
          variables_used: Json | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          opened_at?: string | null
          provider_message_id?: string | null
          rendered_html?: string | null
          rendered_text?: string | null
          source?: string
          status: string
          subject: string
          template_slug: string
          tenant_id?: string | null
          to_email: string
          to_name?: string | null
          variables_used?: Json | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          opened_at?: string | null
          provider_message_id?: string | null
          rendered_html?: string | null
          rendered_text?: string | null
          source?: string
          status?: string
          subject?: string
          template_slug?: string
          tenant_id?: string | null
          to_email?: string
          to_name?: string | null
          variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "transactional_emails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_tenant_ids: { Args: never; Returns: string[] }
      email_exists: { Args: { p_email: string }; Returns: boolean }
      is_caretaker_of: { Args: { p_tenant_id: string }; Returns: boolean }
      is_custodian: { Args: never; Returns: boolean }
      next_patient_number: { Args: { p_tenant: string }; Returns: string }
      publish_legal_draft: { Args: { p_doc_key: string }; Returns: undefined }
    }
    Enums: {
      alert_priority: "info" | "warning" | "critical"
      allergy_severity: "low" | "moderate" | "severe" | "life_threatening"
      feed_entry_type:
        | "clinical_note"
        | "vital_signs"
        | "prescription"
        | "lab_order"
        | "lab_result"
        | "radiology_order"
        | "radiology_result"
        | "photo_set"
        | "consent_signed"
        | "referral_letter"
        | "discharge_summary"
        | "sick_note"
        | "gp_letter"
        | "scanned_document"
        | "ai_promotion"
        | "consultation_summary"
        | "appointment_record"
        | "allergy_recorded"
        | "alert_recorded"
      user_role:
        | "custodian"
        | "caretaker"
        | "curator"
        | "concierge"
        | "clinician"
        | "locum"
        | "nurse"
        | "chemist"
        | "cunnere"
        | "cofferer"
        | "patient"
        | "practitioner"
        | "codewright"
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
    Enums: {
      alert_priority: ["info", "warning", "critical"],
      allergy_severity: ["low", "moderate", "severe", "life_threatening"],
      feed_entry_type: [
        "clinical_note",
        "vital_signs",
        "prescription",
        "lab_order",
        "lab_result",
        "radiology_order",
        "radiology_result",
        "photo_set",
        "consent_signed",
        "referral_letter",
        "discharge_summary",
        "sick_note",
        "gp_letter",
        "scanned_document",
        "ai_promotion",
        "consultation_summary",
        "appointment_record",
        "allergy_recorded",
        "alert_recorded",
      ],
      user_role: [
        "custodian",
        "caretaker",
        "curator",
        "concierge",
        "clinician",
        "locum",
        "nurse",
        "chemist",
        "cunnere",
        "cofferer",
        "patient",
        "practitioner",
        "codewright",
      ],
    },
  },
} as const
