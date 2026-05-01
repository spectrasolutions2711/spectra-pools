export type UserRole = 'admin' | 'technician' | 'client';
export type AreaType = 'POOL' | 'SPA' | 'TANK';
export type VisitStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

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
          contact_phone?: string | null;
          service_days?: string[] | null;
          notes?: string | null;
          active?: boolean;
        };
      };

      pool_areas: {
        Row: {
          id: string;
          location_id: string;
          area_type: AreaType;
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
          area_type: AreaType;
          name: string;
          gallons?: number | null;
          filter_type?: string | null;
          system_type?: string | null;
          has_heater?: boolean;
          notes?: string | null;
          active?: boolean;
        };
        Update: {
          area_type?: AreaType;
          name?: string;
          gallons?: number | null;
          filter_type?: string | null;
          system_type?: string | null;
          has_heater?: boolean;
          notes?: string | null;
          active?: boolean;
        };
      };

      pool_target_params: {
        Row: {
          id: string;
          area_id: string;
          param_name: string;
          min_value: number | null;
          max_value: number | null;
          target_value: number | null;
          unit: string | null;
        };
        Insert: {
          area_id: string;
          param_name: string;
          min_value?: number | null;
          max_value?: number | null;
          target_value?: number | null;
          unit?: string | null;
        };
        Update: {
          min_value?: number | null;
          max_value?: number | null;
          target_value?: number | null;
          unit?: string | null;
        };
      };

      technicians: {
        Row: {
          id: string;
          user_id: string;
          license_number: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          license_number?: string | null;
          active?: boolean;
        };
        Update: {
          license_number?: string | null;
          active?: boolean;
        };
      };

      client_users: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          role: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          client_id: string;
          role?: string;
          active?: boolean;
        };
        Update: {
          role?: string;
          active?: boolean;
        };
      };

      routes: {
        Row: {
          id: string;
          technician_id: string | null;
          name: string;
          day_of_week: string[] | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          technician_id?: string | null;
          day_of_week?: string[] | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          technician_id?: string | null;
          day_of_week?: string[] | null;
          active?: boolean;
        };
      };

      route_stops: {
        Row: {
          id: string;
          route_id: string;
          location_id: string;
          stop_order: number;
          estimated_service_minutes: number | null;
        };
        Insert: {
          route_id: string;
          location_id: string;
          stop_order: number;
          estimated_service_minutes?: number | null;
        };
        Update: {
          stop_order?: number;
          estimated_service_minutes?: number | null;
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
          status: VisitStatus;
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
          status?: VisitStatus;
          service_email_sent?: boolean;
          synced?: boolean;
        };
        Update: {
          checkin_time?: string | null;
          checkout_time?: string | null;
          duration_minutes?: number | null;
          status?: VisitStatus;
          service_email_sent?: boolean;
          synced?: boolean;
        };
      };

      checklist_items: {
        Row: {
          id: string;
          visit_id: string;
          task: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          visit_id: string;
          task: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
        };
      };

      maintenance_ops: {
        Row: {
          id: string;
          visit_id: string;
          operation: string;
          area_type: AreaType | null;
          notes: string | null;
        };
        Insert: {
          visit_id: string;
          operation: string;
          area_type?: AreaType | null;
          notes?: string | null;
        };
        Update: {
          operation?: string;
          notes?: string | null;
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
          not_set?: boolean | null;
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

      products: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          unit: string;
          cost_per_unit: number | null;
          active: boolean;
        };
        Insert: {
          name: string;
          category?: string | null;
          unit?: string;
          cost_per_unit?: number | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          category?: string | null;
          unit?: string;
          cost_per_unit?: number | null;
          active?: boolean;
        };
      };

      inventory: {
        Row: {
          id: string;
          product_id: string;
          quantity_on_hand: number;
          low_stock_threshold: number | null;
          last_updated: string;
        };
        Insert: {
          product_id: string;
          quantity_on_hand?: number;
          low_stock_threshold?: number | null;
        };
        Update: {
          quantity_on_hand?: number;
          low_stock_threshold?: number | null;
          last_updated?: string;
        };
      };

      chemical_dosages: {
        Row: {
          id: string;
          visit_id: string;
          area_id: string | null;
          product_id: string;
          quantity: number;
          unit: string;
          cost: number | null;
          applied_at: string;
        };
        Insert: {
          visit_id: string;
          area_id?: string | null;
          product_id: string;
          quantity: number;
          unit: string;
          cost?: number | null;
        };
        Update: {
          quantity?: number;
          unit?: string;
          cost?: number | null;
        };
      };

      visit_photos: {
        Row: {
          id: string;
          visit_id: string;
          storage_path: string;
          photo_type: string | null;
          caption: string | null;
          taken_at: string;
        };
        Insert: {
          visit_id: string;
          storage_path: string;
          photo_type?: string | null;
          caption?: string | null;
        };
        Update: {
          caption?: string | null;
        };
      };

      visit_notes: {
        Row: {
          id: string;
          visit_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          visit_id: string;
          note: string;
        };
        Update: {
          note?: string;
        };
      };

      items_needed: {
        Row: {
          id: string;
          visit_id: string;
          location_id: string;
          description: string;
          resolved: boolean;
          resolved_at: string | null;
        };
        Insert: {
          visit_id: string;
          location_id: string;
          description: string;
          resolved?: boolean;
        };
        Update: {
          resolved?: boolean;
          resolved_at?: string | null;
        };
      };

      work_orders: {
        Row: {
          id: string;
          location_id: string;
          technician_id: string | null;
          title: string;
          description: string | null;
          priority: WorkOrderPriority;
          status: WorkOrderStatus;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          location_id: string;
          technician_id?: string | null;
          title: string;
          description?: string | null;
          priority?: WorkOrderPriority;
          status?: WorkOrderStatus;
          due_date?: string | null;
        };
        Update: {
          technician_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: WorkOrderPriority;
          status?: WorkOrderStatus;
          due_date?: string | null;
          completed_at?: string | null;
        };
      };

      invoices: {
        Row: {
          id: string;
          client_id: string;
          invoice_number: string;
          period_start: string;
          period_end: string;
          subtotal: number;
          tax: number;
          total: number;
          status: InvoiceStatus;
          due_date: string | null;
          paid_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          client_id: string;
          invoice_number: string;
          period_start: string;
          period_end: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          status?: InvoiceStatus;
          due_date?: string | null;
          notes?: string | null;
        };
        Update: {
          status?: InvoiceStatus;
          subtotal?: number;
          tax?: number;
          total?: number;
          due_date?: string | null;
          paid_at?: string | null;
          notes?: string | null;
        };
      };

      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          item_type: string;
        };
        Insert: {
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          item_type?: string;
        };
        Update: {
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
        };
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      area_type: AreaType;
      visit_status: VisitStatus;
      work_order_priority: WorkOrderPriority;
      work_order_status: WorkOrderStatus;
      invoice_status: InvoiceStatus;
    };
  };
}
