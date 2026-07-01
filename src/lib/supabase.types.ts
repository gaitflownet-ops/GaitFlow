export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Roles de usuario — espejo del ENUM user_role en la DB */
export type UserRole =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'STABLE_ADMIN'
  | 'VETERINARIAN'
  | 'TRAINER'
  | 'GROOM'
  | 'FARRIER'
  | 'DENTIST'
  | 'REPRODUCTION_TECH'
  | 'NUTRITION_MANAGER'
  | 'COMPETITION_STAFF'
  | 'TRANSPORT_STAFF';

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          details: string | null;
          organization_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          details?: string | null;
          organization_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          details?: string | null;
          organization_id?: string;
          created_at?: string | null;
        };
      };
      ccc_daily_coverage_logs: {
        Row: {
          id: string;
          team_id: string;
          shift_id: string | null;
          date: string;
          activities_completed: string[] | null;
          horses_checked: number | null;
          feeding_confirmed: boolean | null;
          water_available: boolean | null;
          observations: string | null;
          behavior_notes: string | null;
          body_condition_notes: string | null;
          health_alerts: string | null;
          incidents: string | null;
          logged_by: string | null;
          organization_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          shift_id?: string | null;
          date?: string;
          activities_completed?: string[] | null;
          horses_checked?: number | null;
          feeding_confirmed?: boolean | null;
          water_available?: boolean | null;
          observations?: string | null;
          behavior_notes?: string | null;
          body_condition_notes?: string | null;
          health_alerts?: string | null;
          incidents?: string | null;
          logged_by?: string | null;
          organization_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          shift_id?: string | null;
          date?: string;
          activities_completed?: string[] | null;
          horses_checked?: number | null;
          feeding_confirmed?: boolean | null;
          water_available?: boolean | null;
          observations?: string | null;
          behavior_notes?: string | null;
          body_condition_notes?: string | null;
          health_alerts?: string | null;
          incidents?: string | null;
          logged_by?: string | null;
          organization_id?: string;
          created_at?: string | null;
        };
      };
      ccc_work_shifts: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          start_time: string;
          end_time: string;
          status: string | null;
          organization_id: string;
          created_at: string | null;
          height: string | null;
          microchip: string | null;
          passport_number: string | null;
          usef_id: string | null;
          fei_id: string | null;
          aqha_id: string | null;
          registry_number: string | null;
          ownership_history: Json | null;
          acquisition_date: string | null;
          estimated_value: string | null;
          sire_id: string | null;
          dam_id: string | null;
          sire_name: string | null;
          dam_name: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          start_time: string;
          end_time: string;
          status?: string | null;
          organization_id: string;
          created_at?: string | null;
          height?: string | null;
          microchip?: string | null;
          passport_number?: string | null;
          usef_id?: string | null;
          fei_id?: string | null;
          aqha_id?: string | null;
          registry_number?: string | null;
          ownership_history?: Json | null;
          acquisition_date?: string | null;
          estimated_value?: string | null;
          sire_id?: string | null;
          dam_id?: string | null;
          sire_name?: string | null;
          dam_name?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          start_time?: string;
          end_time?: string;
          status?: string | null;
          organization_id?: string;
          created_at?: string | null;
          height?: string | null;
          microchip?: string | null;
          passport_number?: string | null;
          usef_id?: string | null;
          fei_id?: string | null;
          aqha_id?: string | null;
          registry_number?: string | null;
          ownership_history?: Json | null;
          acquisition_date?: string | null;
          estimated_value?: string | null;
          sire_id?: string | null;
          dam_id?: string | null;
          sire_name?: string | null;
          dam_name?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          previous_value: Json | null;
          new_value: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          previous_value?: Json | null;
          new_value?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          previous_value?: Json | null;
          new_value?: Json | null;
          created_at?: string | null;
        };
      };
      breeding_cycles: {
        Row: {
          id: string;
          mare_id: string;
          stallion_id: string;
          method: string | null;
          date: string;
          status: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
          semen_type: string | null;
          breeding_report_number: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          mare_id: string;
          stallion_id: string;
          method?: string | null;
          date: string;
          status?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
          semen_type?: string | null;
          breeding_report_number?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          mare_id?: string;
          stallion_id?: string;
          method?: string | null;
          date?: string;
          status?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          semen_type?: string | null;
          breeding_report_number?: string | null;
          notes?: string | null;
        };
      };
      breeding_records: {
        Row: {
          id: string;
          mare_id: string;
          stallion_id: string;
          method: string | null;
          insemination_date: string;
          pregnancy_status: string | null;
          expected_foaling_date: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          mare_id: string;
          stallion_id: string;
          method?: string | null;
          insemination_date: string;
          pregnancy_status?: string | null;
          expected_foaling_date?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          mare_id?: string;
          stallion_id?: string;
          method?: string | null;
          insemination_date?: string;
          pregnancy_status?: string | null;
          expected_foaling_date?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      competitions: {
        Row: {
          id: string;
          horse_id: string;
          event: string;
          date: string;
          location: string | null;
          category: string | null;
          placement: string | null;
          rider: string | null;
          prize: string | null;
          notes: string | null;
          judges: string[] | null;
          created_at: string | null;
          organization_id: string | null;
          gait_category: string | null;
          grade: string | null;
          ribbon_color: string | null;
          championship_title: string | null;
          trainer: string | null;
        };
        Insert: {
          id?: string;
          horse_id: string;
          event: string;
          date: string;
          location?: string | null;
          category?: string | null;
          placement?: string | null;
          rider?: string | null;
          prize?: string | null;
          notes?: string | null;
          judges?: string[] | null;
          created_at?: string | null;
          organization_id?: string | null;
          gait_category?: string | null;
          grade?: string | null;
          ribbon_color?: string | null;
          championship_title?: string | null;
          trainer?: string | null;
        };
        Update: {
          id?: string;
          horse_id?: string;
          event?: string;
          date?: string;
          location?: string | null;
          category?: string | null;
          placement?: string | null;
          rider?: string | null;
          prize?: string | null;
          notes?: string | null;
          judges?: string[] | null;
          created_at?: string | null;
          organization_id?: string | null;
          gait_category?: string | null;
          grade?: string | null;
          ribbon_color?: string | null;
          championship_title?: string | null;
          trainer?: string | null;
        };
      };
      contact_interactions: {
        Row: {
          id: string;
          contact_id: string;
          type: string;
          summary: string;
          details: string | null;
          date: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          contact_id: string;
          type: string;
          summary: string;
          details?: string | null;
          date?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          contact_id?: string;
          type?: string;
          summary?: string;
          details?: string | null;
          date?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      contact_submissions: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          stable_name: string | null;
          subject: string | null;
          category: string;
          message: string;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          stable_name?: string | null;
          subject?: string | null;
          category: string;
          message: string;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          stable_name?: string | null;
          subject?: string | null;
          category?: string;
          message?: string;
          status?: string | null;
          created_at?: string | null;
        };
      };
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          type: string;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          type: string;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          type?: string;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      demo_requests: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          stable_name: string | null;
          business_type: string | null;
          horse_count: string | null;
          primary_interest: string | null;
          plan_interest: string | null;
          scheduled_at: string | null;
          calendly_event: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          status: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          stable_name?: string | null;
          business_type?: string | null;
          horse_count?: string | null;
          primary_interest?: string | null;
          plan_interest?: string | null;
          scheduled_at?: string | null;
          calendly_event?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          stable_name?: string | null;
          business_type?: string | null;
          horse_count?: string | null;
          primary_interest?: string | null;
          plan_interest?: string | null;
          scheduled_at?: string | null;
          calendly_event?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
      };
      diets: {
        Row: {
          id: string;
          horse_id: string;
          feed_type: string;
          quantity: string;
          schedule: string;
          supplements: string | null;
          notes: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          horse_id: string;
          feed_type: string;
          quantity: string;
          schedule: string;
          supplements?: string | null;
          notes?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          horse_id?: string;
          feed_type?: string;
          quantity?: string;
          schedule?: string;
          supplements?: string | null;
          notes?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: string;
          file_url: string;
          file_size: string | null;
          uploaded_by: string | null;
          issue_date: string | null;
          expiration_date: string | null;
          access_level: string | null;
          integrity_hash: string | null;
          version: number | null;
          reference_module: string | null;
          reference_id: string | null;
          owner_type: string | null;
          owner_id: string | null;
          previous_version_id: string | null;
          verified: string | null;
          verified_by: string | null;
          verification_date: string | null;
          is_archived: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          type: string;
          file_url: string;
          file_size?: string | null;
          uploaded_by?: string | null;
          issue_date?: string | null;
          expiration_date?: string | null;
          access_level?: string | null;
          integrity_hash?: string | null;
          version?: number | null;
          reference_module?: string | null;
          reference_id?: string | null;
          owner_type?: string | null;
          owner_id?: string | null;
          previous_version_id?: string | null;
          verified?: string | null;
          verified_by?: string | null;
          verification_date?: string | null;
          is_archived?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          type?: string;
          file_url?: string;
          file_size?: string | null;
          uploaded_by?: string | null;
          issue_date?: string | null;
          expiration_date?: string | null;
          access_level?: string | null;
          integrity_hash?: string | null;
          version?: number | null;
          reference_module?: string | null;
          reference_id?: string | null;
          owner_type?: string | null;
          owner_id?: string | null;
          previous_version_id?: string | null;
          verified?: string | null;
          verified_by?: string | null;
          verification_date?: string | null;
          is_archived?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          category: string;
          amount: number;
          date: string;
          horse_id: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          category: string;
          amount: number;
          date: string;
          horse_id?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          category?: string;
          amount?: number;
          date?: string;
          horse_id?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      farms: {
        Row: {
          id: string;
          slug: string;
          name: string;
          location: string | null;
          description: string | null;
          logo_initials: string | null;
          cover_image_url: string | null;
          specialties: string[] | null;
          badges: string[] | null;
          owner_id: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          location?: string | null;
          description?: string | null;
          logo_initials?: string | null;
          cover_image_url?: string | null;
          specialties?: string[] | null;
          badges?: string[] | null;
          owner_id?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          location?: string | null;
          description?: string | null;
          logo_initials?: string | null;
          cover_image_url?: string | null;
          specialties?: string[] | null;
          badges?: string[] | null;
          owner_id?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          listing_id?: string;
          created_at?: string | null;
        };
      };
      genetic_inventory: {
        Row: {
          id: string;
          farm_id: string;
          material_type: string;
          donor_id: string | null;
          status: string | null;
          storage_location: string | null;
          cost: number | null;
          expiration_date: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          farm_id: string;
          material_type: string;
          donor_id?: string | null;
          status?: string | null;
          storage_location?: string | null;
          cost?: number | null;
          expiration_date?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          farm_id?: string;
          material_type?: string;
          donor_id?: string | null;
          status?: string | null;
          storage_location?: string | null;
          cost?: number | null;
          expiration_date?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      genetics: {
        Row: {
          id: string;
          type: string;
          sire: string;
          dam: string;
          price: string | null;
          availability: string | null;
          description: string | null;
          expected_traits: string[] | null;
          image_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          type: string;
          sire: string;
          dam: string;
          price?: string | null;
          availability?: string | null;
          description?: string | null;
          expected_traits?: string[] | null;
          image_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          type?: string;
          sire?: string;
          dam?: string;
          price?: string | null;
          availability?: string | null;
          description?: string | null;
          expected_traits?: string[] | null;
          image_url?: string | null;
          created_at?: string | null;
        };
      };
      genetics_inventory: {
        Row: {
          id: string;
          material_type: string;
          source: string | null;
          expiration_date: string | null;
          owner_id: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          material_type: string;
          source?: string | null;
          expiration_date?: string | null;
          owner_id?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          material_type?: string;
          source?: string | null;
          expiration_date?: string | null;
          owner_id?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      health_records: {
        Row: {
          id: string;
          horse_id: string;
          horse_name: string;
          type: string;
          title: string;
          notes: string;
          professional: string;
          date: string;
          next_due: string | null;
          status: string | null;
          created_at: string | null;
          diagnosis: string | null;
          prescription: string | null;
          dose: string | null;
          frequency: string | null;
          product_used: string | null;
          product_quantity: number | null;
          cost: number | null;
          attachments: Json | null;
          recurrence: string | null;
          category: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          horse_id: string;
          horse_name: string;
          type: string;
          title: string;
          notes: string;
          professional: string;
          date: string;
          next_due?: string | null;
          status?: string | null;
          created_at?: string | null;
          diagnosis?: string | null;
          prescription?: string | null;
          dose?: string | null;
          frequency?: string | null;
          product_used?: string | null;
          product_quantity?: number | null;
          cost?: number | null;
          attachments?: Json | null;
          recurrence?: string | null;
          category?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          horse_id?: string;
          horse_name?: string;
          type?: string;
          title?: string;
          notes?: string;
          professional?: string;
          date?: string;
          next_due?: string | null;
          status?: string | null;
          created_at?: string | null;
          diagnosis?: string | null;
          prescription?: string | null;
          dose?: string | null;
          frequency?: string | null;
          product_used?: string | null;
          product_quantity?: number | null;
          cost?: number | null;
          attachments?: Json | null;
          recurrence?: string | null;
          category?: string | null;
          organization_id?: string | null;
        };
      };
      horse_groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          farm_id: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          farm_id?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          farm_id?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      horse_results: {
        Row: {
          id: string;
          horse_id: string;
          competition_id: string;
          position: string | null;
          rider: string | null;
          trainer: string | null;
          score: string | null;
          awards: string | null;
          media: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          horse_id: string;
          competition_id: string;
          position?: string | null;
          rider?: string | null;
          trainer?: string | null;
          score?: string | null;
          awards?: string | null;
          media?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          horse_id?: string;
          competition_id?: string;
          position?: string | null;
          rider?: string | null;
          trainer?: string | null;
          score?: string | null;
          awards?: string | null;
          media?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      horse_subgroups: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          description: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          description?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      horses: {
        Row: {
          id: string;
          slug: string;
          name: string;
          barn_name: string;
          breed: string | null;
          age: number | null;
          sex: string | null;
          color: string | null;
          discipline: string | null;
          owner_id: string | null;
          trainer: string | null;
          location: string | null;
          farm_id: string | null;
          bloodline: string | null;
          latest_achievement: string | null;
          image_url: string | null;
          status: string | null;
          wins: number | null;
          earnings: string | null;
          price: string | null;
          sale_status: string | null;
          badges: string[] | null;
          temperament: number | null;
          story: string | null;
          is_public: boolean | null;
          created_at: string | null;
          height: string | null;
          microchip: string | null;
          passport_number: string | null;
          usef_id: string | null;
          fei_id: string | null;
          aqha_id: string | null;
          registry_number: string | null;
          acquisition_date: string | null;
          estimated_value: string | null;
          sire_id: string | null;
          dam_id: string | null;
          sire_name: string | null;
          dam_name: string | null;
          ownership_history: Json | null;
          group_id: string | null;
          subgroup_id: string | null;
          organization_id: string | null;
          registered_name: string | null;
          stable_name: string | null;
          gait_type: string | null;
          movement_category: string | null;
          training_level: string | null;
          morphology_notes: string | null;
          criadero: string | null;
          breeder_name: string | null;
          registration_category: string | null;
          fedequinas_id: string | null;
          association: string | null;
          brio: number | null;
          nobleza: number | null;
          performance_notes: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          barn_name: string;
          breed?: string | null;
          age?: number | null;
          sex?: string | null;
          color?: string | null;
          discipline?: string | null;
          owner_id?: string | null;
          trainer?: string | null;
          location?: string | null;
          farm_id?: string | null;
          bloodline?: string | null;
          latest_achievement?: string | null;
          image_url?: string | null;
          status?: string | null;
          wins?: number | null;
          earnings?: string | null;
          price?: string | null;
          sale_status?: string | null;
          badges?: string[] | null;
          temperament?: number | null;
          story?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
          height?: string | null;
          microchip?: string | null;
          passport_number?: string | null;
          usef_id?: string | null;
          fei_id?: string | null;
          aqha_id?: string | null;
          registry_number?: string | null;
          acquisition_date?: string | null;
          estimated_value?: string | null;
          sire_id?: string | null;
          dam_id?: string | null;
          sire_name?: string | null;
          dam_name?: string | null;
          ownership_history?: Json | null;
          group_id?: string | null;
          subgroup_id?: string | null;
          organization_id?: string | null;
          registered_name?: string | null;
          stable_name?: string | null;
          gait_type?: string | null;
          movement_category?: string | null;
          training_level?: string | null;
          morphology_notes?: string | null;
          criadero?: string | null;
          breeder_name?: string | null;
          registration_category?: string | null;
          fedequinas_id?: string | null;
          association?: string | null;
          brio?: number | null;
          nobleza?: number | null;
          performance_notes?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          barn_name?: string;
          breed?: string | null;
          age?: number | null;
          sex?: string | null;
          color?: string | null;
          discipline?: string | null;
          owner_id?: string | null;
          trainer?: string | null;
          location?: string | null;
          farm_id?: string | null;
          bloodline?: string | null;
          latest_achievement?: string | null;
          image_url?: string | null;
          status?: string | null;
          wins?: number | null;
          earnings?: string | null;
          price?: string | null;
          sale_status?: string | null;
          badges?: string[] | null;
          temperament?: number | null;
          story?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
          height?: string | null;
          microchip?: string | null;
          passport_number?: string | null;
          usef_id?: string | null;
          fei_id?: string | null;
          aqha_id?: string | null;
          registry_number?: string | null;
          acquisition_date?: string | null;
          estimated_value?: string | null;
          sire_id?: string | null;
          dam_id?: string | null;
          sire_name?: string | null;
          dam_name?: string | null;
          ownership_history?: Json | null;
          group_id?: string | null;
          subgroup_id?: string | null;
          organization_id?: string | null;
          registered_name?: string | null;
          stable_name?: string | null;
          gait_type?: string | null;
          movement_category?: string | null;
          training_level?: string | null;
          morphology_notes?: string | null;
          criadero?: string | null;
          breeder_name?: string | null;
          registration_category?: string | null;
          fedequinas_id?: string | null;
          association?: string | null;
          brio?: number | null;
          nobleza?: number | null;
          performance_notes?: string | null;
        };
      };
      hw_forecasts: {
        Row: {
          id: string;
          target_type: string;
          target_id: string | null;
          forecast_data: Json;
          confidence_score: number | null;
          generated_at: string | null;
        };
        Insert: {
          id?: string;
          target_type: string;
          target_id?: string | null;
          forecast_data: Json;
          confidence_score?: number | null;
          generated_at?: string | null;
        };
        Update: {
          id?: string;
          target_type?: string;
          target_id?: string | null;
          forecast_data?: Json;
          confidence_score?: number | null;
          generated_at?: string | null;
        };
      };
      inquiries: {
        Row: {
          id: string;
          buyer_id: string;
          listing_id: string;
          message: string;
          status: string | null;
          organization_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          listing_id: string;
          message: string;
          status?: string | null;
          organization_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          listing_id?: string;
          message?: string;
          status?: string | null;
          organization_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      invoices: {
        Row: {
          id: string;
          farm_id: string;
          client_id: string | null;
          type: string;
          category: string;
          amount: number;
          currency: string | null;
          status: string | null;
          due_date: string | null;
          notes: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          farm_id: string;
          client_id?: string | null;
          type: string;
          category: string;
          amount: number;
          currency?: string | null;
          status?: string | null;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          farm_id?: string;
          client_id?: string | null;
          type?: string;
          category?: string;
          amount?: number;
          currency?: string | null;
          status?: string | null;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      lead_captures: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          stable_name: string | null;
          state_country: string | null;
          plan_interest: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          traffic_origin: string | null;
          form_type: string;
          profile_id: string | null;
          status: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          stable_name?: string | null;
          state_country?: string | null;
          plan_interest?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          traffic_origin?: string | null;
          form_type: string;
          profile_id?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          stable_name?: string | null;
          state_country?: string | null;
          plan_interest?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          traffic_origin?: string | null;
          form_type?: string;
          profile_id?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
      };
      legal_acceptances: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          version: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          version: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          version?: string;
          accepted_at?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          type: string;
          price: number;
          description: string | null;
          status: string | null;
          horse_id: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
          title: string | null;
          gait_type: string | null;
          registration_info: string | null;
          criadero: string | null;
          breeding_value: string | null;
          competition_summary: string | null;
          videos: Json | null;
          photos: Json | null;
        };
        Insert: {
          id?: string;
          seller_id: string;
          type: string;
          price: number;
          description?: string | null;
          status?: string | null;
          horse_id?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
          title?: string | null;
          gait_type?: string | null;
          registration_info?: string | null;
          criadero?: string | null;
          breeding_value?: string | null;
          competition_summary?: string | null;
          videos?: Json | null;
          photos?: Json | null;
        };
        Update: {
          id?: string;
          seller_id?: string;
          type?: string;
          price?: number;
          description?: string | null;
          status?: string | null;
          horse_id?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          title?: string | null;
          gait_type?: string | null;
          registration_info?: string | null;
          criadero?: string | null;
          breeding_value?: string | null;
          competition_summary?: string | null;
          videos?: Json | null;
          photos?: Json | null;
        };
      };
      locations: {
        Row: {
          id: string;
          farm_id: string;
          name: string;
          type: string;
          capacity: number | null;
          status: string | null;
          notes: string | null;
          created_at: string | null;
          organization_id: string | null;
          address: string | null;
        };
        Insert: {
          id?: string;
          farm_id: string;
          name: string;
          type: string;
          capacity?: number | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
          address?: string | null;
        };
        Update: {
          id?: string;
          farm_id?: string;
          name?: string;
          type?: string;
          capacity?: number | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
          address?: string | null;
        };
      };
      mares: {
        Row: {
          horse_id: string;
          role: string;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
          heat_cycle_notes: string | null;
          last_ultrasound: string | null;
          breeding_status: string | null;
        };
        Insert: {
          horse_id: string;
          role?: string;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
          heat_cycle_notes?: string | null;
          last_ultrasound?: string | null;
          breeding_status?: string | null;
        };
        Update: {
          horse_id?: string;
          role?: string;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          heat_cycle_notes?: string | null;
          last_ultrasound?: string | null;
          breeding_status?: string | null;
        };
      };
      marketplace_listings: {
        Row: {
          id: string;
          horse_id: string | null;
          genetic_id: string | null;
          seller_id: string;
          price: number;
          currency: string | null;
          status: string | null;
          description: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          horse_id?: string | null;
          genetic_id?: string | null;
          seller_id: string;
          price: number;
          currency?: string | null;
          status?: string | null;
          description?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          horse_id?: string | null;
          genetic_id?: string | null;
          seller_id?: string;
          price?: number;
          currency?: string | null;
          status?: string | null;
          description?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      medical_events: {
        Row: {
          id: string;
          organization_id: string;
          horse_id: string;
          event_type: string;
          title: string;
          notes: string | null;
          professional: string | null;
          date: string;
          next_due: string | null;
          medication_id: string | null;
          medication_quantity: number | null;
          cost: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          horse_id: string;
          event_type: string;
          title: string;
          notes?: string | null;
          professional?: string | null;
          date: string;
          next_due?: string | null;
          medication_id?: string | null;
          medication_quantity?: number | null;
          cost?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          horse_id?: string;
          event_type?: string;
          title?: string;
          notes?: string | null;
          professional?: string | null;
          date?: string;
          next_due?: string | null;
          medication_id?: string | null;
          medication_quantity?: number | null;
          cost?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      medications: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          category: string | null;
          stock_quantity: number | null;
          unit: string | null;
          min_stock_alert: number | null;
          cost_per_unit: number | null;
          expiry_date: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          category?: string | null;
          stock_quantity?: number | null;
          unit?: string | null;
          min_stock_alert?: number | null;
          cost_per_unit?: number | null;
          expiry_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          category?: string | null;
          stock_quantity?: number | null;
          unit?: string | null;
          min_stock_alert?: number | null;
          cost_per_unit?: number | null;
          expiry_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          kind: string;
          read: boolean | null;
          horse_id: string | null;
          at: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          kind: string;
          read?: boolean | null;
          horse_id?: string | null;
          at?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          kind?: string;
          read?: boolean | null;
          horse_id?: string | null;
          at?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      nutrition_plans: {
        Row: {
          id: string;
          horse_id: string;
          plan_name: string;
          ingredients: Json;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          horse_id: string;
          plan_name: string;
          ingredients: Json;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          horse_id?: string;
          plan_name?: string;
          ingredients?: Json;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: string;
          joined_at: string | null;
          availability_status: string | null;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: string;
          joined_at?: string | null;
          availability_status?: string | null;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string | null;
          availability_status?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          logo: string | null;
          contact_information: Json | null;
          address: string | null;
          subscription_plan: string | null;
          created_at: string | null;
          updated_at: string | null;
          phone: string | null;
          plan: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          logo?: string | null;
          contact_information?: Json | null;
          address?: string | null;
          subscription_plan?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          phone?: string | null;
          plan?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          logo?: string | null;
          contact_information?: Json | null;
          address?: string | null;
          subscription_plan?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          phone?: string | null;
          plan?: string | null;
        };
      };
      ownership_history: {
        Row: {
          id: string;
          horse_id: string;
          owner_id: string | null;
          percentage: number;
          start_date: string;
          end_date: string | null;
          organization_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          horse_id: string;
          owner_id?: string | null;
          percentage?: number;
          start_date: string;
          end_date?: string | null;
          organization_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          horse_id?: string;
          owner_id?: string | null;
          percentage?: number;
          start_date?: string;
          end_date?: string | null;
          organization_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          date: string;
          method: string;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          amount: number;
          date: string;
          method: string;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          amount?: number;
          date?: string;
          method?: string;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      permissions: {
        Row: {
          id: string;
          role: string;
          module: string;
          can_view: boolean;
          can_create: boolean;
          can_edit: boolean;
          can_delete: boolean;
          organization_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          role: string;
          module: string;
          can_view?: boolean;
          can_create?: boolean;
          can_edit?: boolean;
          can_delete?: boolean;
          organization_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          role?: string;
          module?: string;
          can_view?: boolean;
          can_create?: boolean;
          can_edit?: boolean;
          can_delete?: boolean;
          organization_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      pharmaceutical_inventory: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          manufacturer: string | null;
          unit: string | null;
          stock_quantity: number | null;
          min_stock_alert: number | null;
          cost_per_unit: number | null;
          expiry_date: string | null;
          notes: string | null;
          farm_id: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          manufacturer?: string | null;
          unit?: string | null;
          stock_quantity?: number | null;
          min_stock_alert?: number | null;
          cost_per_unit?: number | null;
          expiry_date?: string | null;
          notes?: string | null;
          farm_id?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          manufacturer?: string | null;
          unit?: string | null;
          stock_quantity?: number | null;
          min_stock_alert?: number | null;
          cost_per_unit?: number | null;
          expiry_date?: string | null;
          notes?: string | null;
          farm_id?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      pregnancies: {
        Row: {
          id: string;
          mare_id: string;
          expected_date: string;
          status: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
          ultrasound_dates: Json | null;
          stallion_id: string | null;
          birth_report_number: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          mare_id: string;
          expected_date: string;
          status?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
          ultrasound_dates?: Json | null;
          stallion_id?: string | null;
          birth_report_number?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          mare_id?: string;
          expected_date?: string;
          status?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          ultrasound_dates?: Json | null;
          stallion_id?: string | null;
          birth_report_number?: string | null;
          notes?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          role: string;
          stable_name: string | null;
          initials: string | null;
          phone: string | null;
          created_at: string | null;
          organization_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          role?: string;
          stable_name?: string | null;
          initials?: string | null;
          phone?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          stable_name?: string | null;
          initials?: string | null;
          phone?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
      };
      stall_assignments: {
        Row: {
          id: string;
          location_id: string;
          horse_id: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          location_id: string;
          horse_id: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string;
          horse_id?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
        };
      };
      stall_units: {
        Row: {
          id: string;
          location_id: string;
          stall_number: string;
          availability: boolean | null;
          horse_id: string | null;
          organization_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          location_id: string;
          stall_number: string;
          availability?: boolean | null;
          horse_id?: string | null;
          organization_id: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string;
          stall_number?: string;
          availability?: boolean | null;
          horse_id?: string | null;
          organization_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan: string;
          status: string;
          renewal_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan?: string;
          status?: string;
          renewal_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan?: string;
          status?: string;
          renewal_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      success_stories: {
        Row: {
          id: string;
          farm_name: string;
          location: string;
          avatar_initials: string;
          contact_name: string;
          contact_role: string;
          quote_en: string;
          metric_label_en: string;
          metric_value: string;
          metric_desc_en: string;
          quote_es: string;
          metric_label_es: string;
          metric_desc_es: string;
          is_featured: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          farm_name: string;
          location: string;
          avatar_initials: string;
          contact_name: string;
          contact_role: string;
          quote_en: string;
          metric_label_en: string;
          metric_value: string;
          metric_desc_en: string;
          quote_es: string;
          metric_label_es: string;
          metric_desc_es: string;
          is_featured?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          farm_name?: string;
          location?: string;
          avatar_initials?: string;
          contact_name?: string;
          contact_role?: string;
          quote_en?: string;
          metric_label_en?: string;
          metric_value?: string;
          metric_desc_en?: string;
          quote_es?: string;
          metric_label_es?: string;
          metric_desc_es?: string;
          is_featured?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
      };
      task_templates: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          priority: string | null;
          recurrence: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          priority?: string | null;
          recurrence?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          priority?: string | null;
          recurrence?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          farm_id: string;
          horse_id: string | null;
          assignee_id: string | null;
          title: string;
          description: string | null;
          priority: string | null;
          status: string | null;
          due_date: string | null;
          recurrence: string | null;
          notes: string | null;
          created_at: string | null;
          organization_id: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          farm_id: string;
          horse_id?: string | null;
          assignee_id?: string | null;
          title: string;
          description?: string | null;
          priority?: string | null;
          status?: string | null;
          due_date?: string | null;
          recurrence?: string | null;
          notes?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          farm_id?: string;
          horse_id?: string | null;
          assignee_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: string | null;
          status?: string | null;
          due_date?: string | null;
          recurrence?: string | null;
          notes?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
          completed_at?: string | null;
        };
      };
      team_horse_assignments: {
        Row: {
          id: string;
          team_id: string;
          horse_id: string;
          organization_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          horse_id: string;
          organization_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          horse_id?: string;
          organization_id?: string;
          created_at?: string | null;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          profile_id: string;
          organization_id: string;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          profile_id: string;
          organization_id: string;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          profile_id?: string;
          organization_id?: string;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          is_temporary: boolean | null;
          start_date: string | null;
          end_date: string | null;
          destination: string | null;
          event_notes: string | null;
          team_type: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          is_temporary?: boolean | null;
          start_date?: string | null;
          end_date?: string | null;
          destination?: string | null;
          event_notes?: string | null;
          team_type?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          is_temporary?: boolean | null;
          start_date?: string | null;
          end_date?: string | null;
          destination?: string | null;
          event_notes?: string | null;
          team_type?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      updates: {
        Row: {
          id: string;
          horse_id: string;
          owner_id: string | null;
          type: string;
          title: string;
          body: string;
          media_url: string | null;
          likes: number | null;
          comments: number | null;
          by: string;
          at: string | null;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          horse_id: string;
          owner_id?: string | null;
          type: string;
          title: string;
          body: string;
          media_url?: string | null;
          likes?: number | null;
          comments?: number | null;
          by: string;
          at?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          horse_id?: string;
          owner_id?: string | null;
          type?: string;
          title?: string;
          body?: string;
          media_url?: string | null;
          likes?: number | null;
          comments?: number | null;
          by?: string;
          at?: string | null;
          created_at?: string | null;
          organization_id?: string | null;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: string;
          permissions: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          role?: string;
          permissions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          role?: string;
          permissions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
