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
