export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      passengers: {
        Row: {
          created_at: string
          document_number: string | null
          flight_number: string | null
          full_name: string
          hotel: string | null
          id: number
          participation_id: number
          phone: string | null
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          flight_number?: string | null
          full_name: string
          hotel?: string | null
          id?: number
          participation_id: number
          phone?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string | null
          flight_number?: string | null
          full_name?: string
          hotel?: string | null
          id?: number
          participation_id?: number
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passengers_participation_id_fkey"
            columns: ["participation_id"]
            referencedRelation: "transfer_participations"
            referencedColumns: ["id"]
          }
        ]
      }
      payouts: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          id: number
          status: string
          stripe_transfer_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          id?: number
          status?: string
          stripe_transfer_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          id?: number
          status?: string
          stripe_transfer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          cpf_cnpj: string | null;
          phone: string | null;
          avatar_url: string | null;
          push_token: string | null; // Adicionado para notificações
          document_url: string[] | null;
          status: 'incomplete' | 'pending' | 'approved' | 'rejected'; // 'onboarding' alterado para 'incomplete'
          rejection_reason: string | null;
          created_at: string;
          updated_at: string | null;
          // ✅ CAMPOS DO STRIPE ADICIONADOS
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null; // Adicionado para o trigger
          cpf_cnpj?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          push_token?: string | null;
          document_url?: string[] | null;
          status?: 'incomplete' | 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          cpf_cnpj?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          push_token?: string | null;
          document_url?: string[] | null;
          status?: 'incomplete' | 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean | null;
        };
      };
      vehicles: {
        // (Esta tabela permanece a mesma)
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
        };
        Update: {
          id?: number;
          owner_id?: string;
          model?: string;
          plate?: string;
          color?: string | null;
          total_seats?: number;
          vehicle_picture_url?: string | null;
        };
      };
      // ❌ A TABELA 'subscriptions' FOI REMOVIDA
      transfers: {
        // (Esta tabela permanece a mesma)
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
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      transfer_participations: {
        // (Esta tabela permanece a mesma)
        Row: {
          id: number;
          transfer_id: number;
          participant_id: string;
          seats_requested: number;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      reviews: {
        // (Esta tabela permanece a mesma)
        Row: {
          id: number;
          transfer_id: number;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
    };
  };
}

// Tipos exportados atualizados
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
// ❌ O TIPO 'Subscription' FOI REMOVIDO
export type Transfer = Database['public']['Tables']['transfers']['Row'];
export type TransferParticipation = Database['public']['Tables']['transfer_participations']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];