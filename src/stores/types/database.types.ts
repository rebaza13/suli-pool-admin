// ============================================
// Database Types (Generated types for Supabase)
// ============================================
// This file can be auto-generated from Supabase CLI
// For now, we define basic types based on the schema

export interface Database {
  public: {
    Tables: {
      hero_slides: {
        Row: {
          id: string;
          sort_order: number;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hero_slides']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['hero_slides']['Insert']>;
      };
      hero_slide_translations: {
        Row: {
          id: string;
          hero_slide_id: string;
          locale: string;
          title: string;
          subtitle: string | null;
          sample_text: string | null;
          button_text: string | null;
        };
        Insert: Omit<Database['public']['Tables']['hero_slide_translations']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['hero_slide_translations']['Insert']>;
      };
      hero_slide_images: {
        Row: {
          id: string;
          hero_slide_id: string;
          media_id: number;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['hero_slide_images']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['hero_slide_images']['Insert']>;
      };
      media_assets: {
        Row: {
          id: number;
          bucket: string;
          path: string;
          alt: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['media_assets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['media_assets']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          slug: string;
          sort_order: number;
          is_enabled: boolean;
          duration_days: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      project_translations: {
        Row: {
          id: string;
          project_id: string;
          locale: string;
          badge: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          meta_items: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_translations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_translations']['Insert']>;
      };
      project_images: {
        Row: {
          id: string;
          project_id: string;
          media_id: number;
          sort_order: number;
          is_cover: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_images']['Insert']>;
      };
      locations: {
        Row: {
          id: string;
          slug: string;
          sort_order: number;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['locations']['Insert']>;
      };
      location_translations: {
        Row: {
          id: string;
          location_id: string;
          locale: string;
          section_title: string | null;
          section_subtitle: string | null;
          phone_label: string | null;
          email_label: string | null;
          address: string | null;
          address_label: string | null;
          working_hours: string | null;
          working_hours_label: string | null;
          marker_title: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['location_translations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['location_translations']['Insert']>;
      };
      location: {
        Row: {
          id: string;
          phone: string | null;
          email: string | null;
          map_lat: number | null;
          map_lng: number | null;
          map_zoom: number | null;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['location']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['location']['Insert']>;
      };
      installations: {
        Row: {
          id: number;
          completed_at: string | null;
          is_enabled: boolean;
          sort_order: number;
          location: string | null;
        };
        Insert: Omit<Database['public']['Tables']['installations']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['installations']['Insert']>;
      };
      installation_translations: {
        Row: {
          id: number;
          installation_id: number;
          locale: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['installation_translations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['installation_translations']['Insert']>;
      };
      installation_images: {
        Row: {
          id: number;
          installation_id: number;
          media_id: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['installation_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['installation_images']['Insert']>;
      };
      why_we_different: {
        Row: {
          id: string;
          sort_order: number;
          icon: string;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['why_we_different']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['why_we_different']['Insert']>;
      };
      why_we_different_translations: {
        Row: {
          id: string;
          why_we_different_id: string;
          locale: string;
          title: string;
          description: string;
        };
        Insert: Omit<Database['public']['Tables']['why_we_different_translations']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['why_we_different_translations']['Insert']>;
      };
      about_section: {
        Row: {
          id: string;
          key: string;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['about_section']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['about_section']['Insert']>;
      };
      about_section_translations: {
        Row: {
          id: string;
          about_section_id: string;
          locale: string;
          eyebrow_text: string;
          section_title: string;
          section_subtitle: string;
          description: string;
          card_title: string;
          card_title_highlight: string;
          card_description: string;
          cta_label: string;
          cta_href: string;
        };
        Insert: Omit<Database['public']['Tables']['about_section_translations']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['about_section_translations']['Insert']>;
      };
      about_section_images: {
        Row: {
          id: string;
          about_section_id: string;
          media_asset_id: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['about_section_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['about_section_images']['Insert']>;
      };
      company_statistics: {
        Row: {
          id: string;
          label_en: string;
          label_ku: string;
          label_ar: string;
          value: number;
          icon: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['company_statistics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['company_statistics']['Insert']>;
      };
      installation_steps: {
        Row: {
          id: string;
          sort_order: number;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['installation_steps']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['installation_steps']['Insert']>;
      };
      installation_step_translations: {
        Row: {
          id: string;
          installation_step_id: string;
          locale: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['installation_step_translations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['installation_step_translations']['Insert']>;
      };
      timeline_events: {
        Row: {
          id: string;
          sort_order: number;
          is_enabled: boolean;
          event_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timeline_events']['Insert']>;
      };
      timeline_event_translations: {
        Row: {
          id: string;
          timeline_event_id: string;
          locale: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline_event_translations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timeline_event_translations']['Insert']>;
      };
      timeline_event_images: {
        Row: {
          id: string;
          timeline_event_id: string;
          media_id: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline_event_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timeline_event_images']['Insert']>;
      };

      // Some Supabase projects use *_items naming instead of *_events / *_steps
      installation_items: {
        Row: {
          id: string;
          sort_order: number;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['installation_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['installation_items']['Insert']>;
      };
      installation_item_translations: {
        Row: {
          id: string;
          installation_item_id: string;
          locale: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['installation_item_translations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['installation_item_translations']['Insert']>;
      };
      timeline_items: {
        Row: {
          id: string;
          sort_order: number;
          is_enabled: boolean;
          event_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timeline_items']['Insert']>;
      };
      timeline_item_translations: {
        Row: {
          id: string;
          timeline_item_id: string;
          locale: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline_item_translations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timeline_item_translations']['Insert']>;
      };
      timeline_item_images: {
        Row: {
          id: string;
          timeline_item_id: string;
          media_id: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timeline_item_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timeline_item_images']['Insert']>;
      };
    };
  };
}

