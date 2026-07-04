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
      clinic_address_book: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          kind?: string
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_address_book_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_clinical_modules: {
        Row: {
          created_at: string
          lab_enabled: boolean
          prescribing_enabled: boolean
          procedures_enabled: boolean
          radiology_enabled: boolean
          rolde_ai_enabled: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          lab_enabled?: boolean
          prescribing_enabled?: boolean
          procedures_enabled?: boolean
          radiology_enabled?: boolean
          rolde_ai_enabled?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          lab_enabled?: boolean
          prescribing_enabled?: boolean
          procedures_enabled?: boolean
          radiology_enabled?: boolean
          rolde_ai_enabled?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_clinical_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_courier_settings: {
        Row: {
          chase_after_days: number
          countersign_required: boolean
          created_at: string
          delegated_sending: boolean
          quiet_end: string
          quiet_hours_enabled: boolean
          quiet_start: string
          secure_link_default: boolean
          tenant_id: string
          typo_guard: boolean
          updated_at: string
        }
        Insert: {
          chase_after_days?: number
          countersign_required?: boolean
          created_at?: string
          delegated_sending?: boolean
          quiet_end?: string
          quiet_hours_enabled?: boolean
          quiet_start?: string
          secure_link_default?: boolean
          tenant_id: string
          typo_guard?: boolean
          updated_at?: string
        }
        Update: {
          chase_after_days?: number
          countersign_required?: boolean
          created_at?: string
          delegated_sending?: boolean
          quiet_end?: string
          quiet_hours_enabled?: boolean
          quiet_start?: string
          secure_link_default?: boolean
          tenant_id?: string
          typo_guard?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_courier_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_commercial_settings: {
        Row: {
          consult_credit_enabled: boolean
          consult_credit_label: string
          consult_credit_pence: number
          created_at: string
          currency: string
          deposit_default_pence: number
          deposit_enabled: boolean
          discount_codes_enabled: boolean
          tax_enabled: boolean
          tax_inclusive: boolean
          tax_name: string
          tax_rate_bps: number
          tax_registration: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          consult_credit_enabled?: boolean
          consult_credit_label?: string
          consult_credit_pence?: number
          created_at?: string
          currency?: string
          deposit_default_pence?: number
          deposit_enabled?: boolean
          discount_codes_enabled?: boolean
          tax_enabled?: boolean
          tax_inclusive?: boolean
          tax_name?: string
          tax_rate_bps?: number
          tax_registration?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          consult_credit_enabled?: boolean
          consult_credit_label?: string
          consult_credit_pence?: number
          created_at?: string
          currency?: string
          deposit_default_pence?: number
          deposit_enabled?: boolean
          discount_codes_enabled?: boolean
          tax_enabled?: boolean
          tax_inclusive?: boolean
          tax_name?: string
          tax_rate_bps?: number
          tax_registration?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_commercial_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_services: {
        Row: {
          active: boolean
          category: string | null
          code: string | null
          course_sessions: number | null
          created_at: string
          deposit_pence: number | null
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price_pence: number
          service_type: string
          sort: number
          tax_exempt: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          code?: string | null
          course_sessions?: number | null
          created_at?: string
          deposit_pence?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price_pence?: number
          service_type?: string
          sort?: number
          tax_exempt?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          code?: string | null
          course_sessions?: number | null
          created_at?: string
          deposit_pence?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price_pence?: number
          service_type?: string
          sort?: number
          tax_exempt?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_dispatch_events: {
        Row: {
          created_at: string
          dispatch_id: string
          event: string
          id: string
          meta: Json | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          dispatch_id: string
          event: string
          id?: string
          meta?: Json | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          dispatch_id?: string
          event?: string
          id?: string
          meta?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_dispatch_events_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "courier_dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_dispatch_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_dispatches: {
        Row: {
          address_book_id: string | null
          care_provider_id: string | null
          channel: string
          created_at: string
          delivered_at: string | null
          entry_id: string
          failed_reason: string | null
          id: string
          opened_at: string | null
          patient_id: string
          recipient_email: string
          recipient_kind: string
          recipient_name: string
          sent_at: string | null
          sent_by: string | null
          status: string
          tenant_id: string
          token_expires_at: string
          updated_at: string
          view_token: string
        }
        Insert: {
          address_book_id?: string | null
          care_provider_id?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          entry_id: string
          failed_reason?: string | null
          id?: string
          opened_at?: string | null
          patient_id: string
          recipient_email: string
          recipient_kind: string
          recipient_name: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          tenant_id: string
          token_expires_at: string
          updated_at?: string
          view_token: string
        }
        Update: {
          address_book_id?: string | null
          care_provider_id?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          entry_id?: string
          failed_reason?: string | null
          id?: string
          opened_at?: string | null
          patient_id?: string
          recipient_email?: string
          recipient_kind?: string
          recipient_name?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          tenant_id?: string
          token_expires_at?: string
          updated_at?: string
          view_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_dispatches_address_book_id_fkey"
            columns: ["address_book_id"]
            isOneToOne: false
            referencedRelation: "clinic_address_book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_dispatches_care_provider_id_fkey"
            columns: ["care_provider_id"]
            isOneToOne: false
            referencedRelation: "patient_care_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_dispatches_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "patient_feed_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_dispatches_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_dispatches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      feed_entry_reads: {
        Row: {
          entry_id: string
          id: string
          read_at: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          entry_id: string
          id?: string
          read_at?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          entry_id?: string
          id?: string
          read_at?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_entry_reads_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "patient_feed_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_entry_reads_tenant_id_fkey"
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
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          resource_id: string | null
          resource_type: string | null
          summary: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
          summary?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
          summary?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          source_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          source_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          source_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      export_log: {
        Row: {
          byte_size: number
          columns: Json
          created_at: string
          deleted_at: string | null
          exporter_name: string | null
          exporter_role: string | null
          fingerprint: string
          format: string
          id: string
          orientation: string | null
          artifact_base64: string | null
          reference: string
          row_count: number
          scope: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          byte_size?: number
          columns?: Json
          created_at?: string
          deleted_at?: string | null
          exporter_name?: string | null
          exporter_role?: string | null
          fingerprint: string
          format?: string
          id?: string
          orientation?: string | null
          artifact_base64?: string | null
          reference: string
          row_count?: number
          scope?: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          byte_size?: number
          columns?: Json
          created_at?: string
          deleted_at?: string | null
          exporter_name?: string | null
          exporter_role?: string | null
          fingerprint?: string
          format?: string
          id?: string
          orientation?: string | null
          artifact_base64?: string | null
          reference?: string
          row_count?: number
          scope?: string | null
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_access_log: {
        Row: {
          action: string
          actor_role: string | null
          at: string
          break_glass: boolean
          id: string
          ip_address: string | null
          patient_id: string
          purpose: string | null
          reason: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action?: string
          actor_role?: string | null
          at?: string
          break_glass?: boolean
          id?: string
          ip_address?: string | null
          patient_id: string
          purpose?: string | null
          reason?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_role?: string | null
          at?: string
          break_glass?: boolean
          id?: string
          ip_address?: string | null
          patient_id?: string
          purpose?: string | null
          reason?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_access_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      patient_care_providers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          is_gp: boolean
          name: string
          notes: string | null
          organisation: string | null
          patient_id: string
          phone: string | null
          postcode: string | null
          role: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_gp?: boolean
          name: string
          notes?: string | null
          organisation?: string | null
          patient_id: string
          phone?: string | null
          postcode?: string | null
          role?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_gp?: boolean
          name?: string
          notes?: string | null
          organisation?: string | null
          patient_id?: string
          phone?: string | null
          postcode?: string | null
          role?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_care_providers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_care_providers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string
          phone: string | null
          relationship: string
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          phone?: string | null
          relationship: string
          role?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          phone?: string | null
          relationship?: string
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_contacts_tenant_id_fkey"
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
      patient_medications: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          dose: string | null
          drug: string
          frequency: string | null
          id: string
          notes: string | null
          patient_id: string
          route: string | null
          snomed_code: string | null
          started_on: string | null
          status: string
          stopped_on: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dose?: string | null
          drug: string
          frequency?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          route?: string | null
          snomed_code?: string | null
          started_on?: string | null
          status?: string
          stopped_on?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dose?: string | null
          drug?: string
          frequency?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          route?: string | null
          snomed_code?: string | null
          started_on?: string | null
          status?: string
          stopped_on?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_problems: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          notes: string | null
          onset_date: string | null
          patient_id: string
          snomed_code: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id: string
          snomed_code?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id?: string
          snomed_code?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_problems_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_problems_tenant_id_fkey"
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
          communication_needs: string | null
          contact_preference: string | null
          interpreter_needed: boolean
          known_as: string | null
          middle_names: string | null
          nominated_pharmacy: string | null
          preferred_language: string | null
          title: string | null
          gender_identity: string | null
          has_active_alerts: boolean
          id: string
          last_name: string
          national_health_id: string | null
          occupation: string | null
          patient_number: string | null
          phone_landline: string | null
          phone_mobile: string | null
          portal_activated_at: string | null
          portal_invited_at: string | null
          postcode: string | null
          preferred_contact: string
          pronouns: string | null
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
          communication_needs?: string | null
          contact_preference?: string | null
          interpreter_needed?: boolean
          known_as?: string | null
          middle_names?: string | null
          nominated_pharmacy?: string | null
          preferred_language?: string | null
          title?: string | null
          gender_identity?: string | null
          has_active_alerts?: boolean
          id?: string
          last_name: string
          national_health_id?: string | null
          occupation?: string | null
          patient_number?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          portal_activated_at?: string | null
          portal_invited_at?: string | null
          postcode?: string | null
          preferred_contact?: string
          pronouns?: string | null
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
          communication_needs?: string | null
          contact_preference?: string | null
          interpreter_needed?: boolean
          known_as?: string | null
          middle_names?: string | null
          nominated_pharmacy?: string | null
          preferred_language?: string | null
          title?: string | null
          gender_identity?: string | null
          has_active_alerts?: boolean
          id?: string
          last_name?: string
          national_health_id?: string | null
          occupation?: string | null
          patient_number?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          portal_activated_at?: string | null
          portal_invited_at?: string | null
          postcode?: string | null
          preferred_contact?: string
          pronouns?: string | null
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
          logo_svg: string | null
          logo_svg_dark: string | null
          logo_png: string | null
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
          logo_svg?: string | null
          logo_svg_dark?: string | null
          logo_png?: string | null
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
          logo_svg?: string | null
          logo_svg_dark?: string | null
          logo_png?: string | null
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
      assign_patient_gp: {
        Args: { p_patient: string; p_row: string }
        Returns: undefined
      }
      current_user_tenant_ids: { Args: never; Returns: string[] }
      email_exists: { Args: { p_email: string }; Returns: boolean }
      is_caretaker_of: { Args: { p_tenant_id: string }; Returns: boolean }
      is_custodian: { Args: never; Returns: boolean }
      mirror_auth_audit: { Args: never; Returns: undefined }
      next_patient_number: { Args: { p_tenant: string }; Returns: string }
      publish_legal_draft: { Args: { p_doc_key: string }; Returns: undefined }
      user_id_for_email: { Args: { p_email: string }; Returns: string }
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
        | "problem_recorded"
        | "medication_recorded"
        | "body_map"
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
        "problem_recorded",
        "medication_recorded",
        "body_map",
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
