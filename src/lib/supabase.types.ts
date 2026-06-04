export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          role: string;
          stable_name: string | null;
          initials: string | null;
          phone: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          role?: string;
          stable_name?: string | null;
          initials?: string | null;
          phone?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          stable_name?: string | null;
          initials?: string | null;
          phone?: string | null;
          created_at?: string | null;
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
