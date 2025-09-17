export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          cpf_cnpj: string | null;
          phone: string | null;
          avatar_url: string | null;
          document_url: string[] | null;
          status: 'onboarding' | 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          cpf_cnpj?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          document_url?: string[] | null;
          status?: 'onboarding' | 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          cpf_cnpj?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          document_url?: string[] | null;
          status?: 'onboarding' | 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          created_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: number;
          owner_id: string;
          model: string;
          plate: string;
          color: string | null;
          total_seats: number;
          vehicle_picture_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          owner_id: string;
          model: string;
          plate: string;
          color?: string | null;
          total_seats: number;
          vehicle_picture_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          owner_id?: string;
          model?: string;
          plate?: string;
          color?: string | null;
          total_seats?: number;
          vehicle_picture_url?: string | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro' | 'enterprise';
          status: 'active' | 'canceled' | 'past_due';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          renews_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: 'free' | 'pro' | 'enterprise';
          status: 'active' | 'canceled' | 'past_due';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          renews_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'free' | 'pro' | 'enterprise';
          status?: 'active' | 'canceled' | 'past_due';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          renews_at?: string | null;
        };
      };
      transfers: {
        Row: {
          id: number;
          creator_id: string;
          vehicle_id: number;
          title: string;
          origin_description: string | null;
          destination_description: string | null;
          departure_time: string;
          total_seats: number;
          occupied_seats: number;
          price_per_seat: number | null;
          status: 'available' | 'full' | 'completed' | 'canceled';
          visibility: 'public' | 'private';
          created_at: string;
        };
        Insert: {
          id?: number;
          creator_id: string;
          vehicle_id: number;
          title: string;
          origin_description?: string | null;
          destination_description?: string | null;
          departure_time: string;
          total_seats: number;
          occupied_seats?: number;
          price_per_seat?: number | null;
          status?: 'available' | 'full' | 'completed' | 'canceled';
          visibility?: 'public' | 'private';
          created_at?: string;
        };
        Update: {
          id?: number;
          creator_id?: string;
          vehicle_id?: number;
          title?: string;
          origin_description?: string | null;
          destination_description?: string | null;
          departure_time?: string;
          total_seats?: number;
          occupied_seats?: number;
          price_per_seat?: number | null;
          status?: 'available' | 'full' | 'completed' | 'canceled';
          visibility?: 'public' | 'private';
          created_at?: string;
        };
      };
      transfer_participations: {
        Row: {
          id: number;
          transfer_id: number;
          participant_id: string;
          seats_requested: number;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: number;
          transfer_id: number;
          participant_id: string;
          seats_requested: number;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: number;
          transfer_id?: number;
          participant_id?: string;
          seats_requested?: number;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: number;
          transfer_id: number;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          transfer_id: number;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          transfer_id?: number;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Transfer = Database['public']['Tables']['transfers']['Row'];
export type TransferParticipation = Database['public']['Tables']['transfer_participations']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];