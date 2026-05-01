export type UserRole = 'admin' | 'technician' | 'client';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
        };
        Update: {
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          billing_address: string | null;
          notes: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          billing_address?: string | null;
          notes?: string | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          billing_address?: string | null;
          notes?: string | null;
          active?: boolean;
        };
      };
      client_locations: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          zip: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          latitude: number | null;
          longitude: number | null;
          service_days: string[] | null;
          notes: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          client_id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          zip?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          service_days?: string[] | null;
          notes?: string | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          address?: string;
          city?: string;
          state?: string;
          zip?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          service_days?: string[] | null;
          active?: boolean;
        };
      };
      pool_areas: {
        Row: {
          id: string;
          location_id: string;
          area_type: 'POOL' | 'SPA' | 'TANK';
          name: string;
          gallons: number | null;
          filter_type: string | null;
          system_type: string | null;
          has_heater: boolean;
          notes: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          location_id: string;
          area_type: 'POOL' | 'SPA' | 'TANK';
          name: string;
          gallons?: number | null;
          filter_type?: string | null;
          system_type?: string | null;
          has_heater?: boolean;
          notes?: string | null;
          active?: boolean;
        };
        Update: {
          area_type?: 'POOL' | 'SPA' | 'TANK';
          name?: string;
          gallons?: number | null;
          has_heater?: boolean;
          active?: boolean;
        };
      };
      service_visits: {
        Row: {
          id: string;
          location_id: string;
          technician_id: string;
          visit_date: string;
          checkin_time: string | null;
          checkout_time: string | null;
          duration_minutes: number | null;
          status: 'pending' | 'in_progress' | 'completed' | 'skipped';
          service_email_sent: boolean;
          synced: boolean;
          created_at: string;
        };
        Insert: {
          location_id: string;
          technician_id: string;
          visit_date: string;
          checkin_time?: string | null;
          checkout_time?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
          service_email_sent?: boolean;
          synced?: boolean;
        };
        Update: {
          checkin_time?: string | null;
          checkout_time?: string | null;
          duration_minutes?: number | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
          service_email_sent?: boolean;
          synced?: boolean;
        };
      };
      water_readings: {
        Row: {
          id: string;
          visit_id: string;
          area_id: string;
          reading_section: 'TEST' | 'HEATER';
          ph: number | null;
          orp: number | null;
          orp_setpoint: number | null;
          not_set: boolean | null;
          free_chlorine: number | null;
          total_chlorine: number | null;
          alkalinity: number | null;
          stabilizer_cya: number | null;
          total_hardness: number | null;
          phosphates: number | null;
          salt: number | null;
          temperature: number | null;
          status: string | null;
          lsi_value: number | null;
          recorded_at: string;
          notes: string | null;
        };
        Insert: {
          visit_id: string;
          area_id: string;
          reading_section: 'TEST' | 'HEATER';
          ph?: number | null;
          orp?: number | null;
          orp_setpoint?: number | null;
          free_chlorine?: number | null;
          total_chlorine?: number | null;
          alkalinity?: number | null;
          stabilizer_cya?: number | null;
          total_hardness?: number | null;
          phosphates?: number | null;
          salt?: number | null;
          temperature?: number | null;
          status?: string | null;
          lsi_value?: number | null;
          notes?: string | null;
        };
        Update: {
          ph?: number | null;
          orp?: number | null;
          free_chlorine?: number | null;
          alkalinity?: number | null;
          lsi_value?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'admin' | 'technician' | 'client';
      area_type: 'POOL' | 'SPA' | 'TANK';
      visit_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    };
  };
}
