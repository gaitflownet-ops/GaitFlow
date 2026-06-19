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
  | 'DENTIST';

export interface Database {
  public: {
    Tables: {
      stables: {
        Row: {
          id: string;
          name: string;
          slug: string;
          subscription_plan: string;
          status: string;
          owner_id: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          logo_url: string | null;
          primary_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          subscription_plan?: string;
          status?: string;
          owner_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          subscription_plan?: string;
          status?: string;
          owner_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_stable_roles: {
        Row: {
          id: string;
          user_id: string;
          stable_id: string;
          role: UserRole;
          granted_by: string | null;
          granted_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          stable_id: string;
          role?: UserRole;
          granted_by?: string | null;
          granted_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          stable_id?: string;
          role?: UserRole;
          granted_by?: string | null;
          granted_at?: string;
          is_active?: boolean;
        };
      };
      role_permissions: {
        Row: {
          id: string;
          role: UserRole;
          module: string;
          action: string;
          is_allowed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          role: UserRole;
          module: string;
          action: string;
          is_allowed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          module?: string;
          action?: string;
          is_allowed?: boolean;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          stable_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          stable_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: never; // audit_logs es inmutable
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          role: string;        // legacy — usar user_role para RBAC
          user_role: UserRole;
          stable_id: string | null;
          stable_name: string | null;
          initials: string | null;
          phone: string | null;
          mfa_enabled: boolean;
          last_login_at: string | null;
          created_at: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          role?: string;
          user_role?: UserRole;
          stable_id?: string | null;
          stable_name?: string | null;
          initials?: string | null;
          phone?: string | null;
          mfa_enabled?: boolean;
          last_login_at?: string | null;
          created_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          user_role?: UserRole;
          stable_id?: string | null;
          stable_name?: string | null;
          initials?: string | null;
          phone?: string | null;
          mfa_enabled?: boolean;
          last_login_at?: string | null;
          created_at?: string | null;
          updated_at?: string;
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
          stable_id: string | null;  // multi-tenant isolation
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
          stable_id?: string | null;
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
          stable_id?: string | null;
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
          ownership_history?: Json | null;
          acquisition_date?: string | null;
          estimated_value?: string | null;
          sire_id?: string | null;
          dam_id?: string | null;
          sire_name?: string | null;
          dam_name?: string | null;
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
        };
      };
      documents: {
        Row: {
          id: string;
          name: string;
          category: string;
          file_url: string;
          file_size: string | null;
          horse_id: string | null;
          stable_id: string | null;
          uploaded_by: string | null;
          sha256_hash: string | null;
          version: number;
          expiry_date: string | null;
          access_level: string;
          linked_contact_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          file_url: string;
          file_size?: string | null;
          horse_id?: string | null;
          stable_id?: string | null;
          uploaded_by?: string | null;
          sha256_hash?: string | null;
          version?: number;
          expiry_date?: string | null;
          access_level?: string;
          linked_contact_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          file_url?: string;
          file_size?: string | null;
          horse_id?: string | null;
          stable_id?: string | null;
          uploaded_by?: string | null;
          sha256_hash?: string | null;
          version?: number;
          expiry_date?: string | null;
          access_level?: string;
          linked_contact_id?: string | null;
          created_at?: string | null;
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
  };
}
