// types/database.ts
// Este arquivo é gerado automaticamente pelo Supabase CLI.
// Cole aqui a definição de tipos gerada após executar `supabase gen types typescript`
// Por enquanto, usaremos uma definição manual baseada no nosso script SQL.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          avatar_url: string | null
          balance: number
          cpf_cnpj: string | null
          created_at: string
          document_url: string[] | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          push_token: string | null
          rejection_reason: string | null
          status: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          cpf_cnpj?: string | null
          created_at?: string
          document_url?: string[] | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          push_token?: string | null
          rejection_reason?: string | null
          status?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          cpf_cnpj?: string | null
          created_at?: string
          document_url?: string[] | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          push_token?: string | null
          rejection_reason?: string | null
          status?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          rating: number
          reviewee_id: string
          reviewer_id: string
          transfer_id: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          rating: number
          reviewee_id: string
          reviewer_id: string
          transfer_id: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          transfer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_transfer_id_fkey"
            columns: ["transfer_id"]
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          participation_id: number | null
          stripe_charge_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: number
          participation_id?: number | null
          stripe_charge_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: number
          participation_id?: number | null
          stripe_charge_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_participation_id_fkey"
            columns: ["participation_id"]
            referencedRelation: "transfer_participations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_participations: {
        Row: {
          created_at: string
          id: number
          participant_id: string
          seats_requested: number
          status: string
          stripe_payment_intent_id: string | null
          total_price: number
          transfer_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          participant_id: string
          seats_requested: number
          status?: string
          stripe_payment_intent_id?: string | null
          total_price: number
          transfer_id: number
        }
        Update: {
          created_at?: string
          id?: number
          participant_id?: string
          seats_requested?: number
          status?: string
          stripe_payment_intent_id?: string | null
          total_price?: number
          transfer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transfer_participations_participant_id_fkey"
            columns: ["participant_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_participations_transfer_id_fkey"
            columns: ["transfer_id"]
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_types: {
        Row: {
          created_at: string
          destination_description: string | null
          id: number
          is_active: boolean
          origin_description: string | null
          title: string
        }
        Insert: {
          created_at?: string
          destination_description?: string | null
          id?: number
          is_active?: boolean
          origin_description?: string | null
          title: string
        }
        Update: {
          created_at?: string
          destination_description?: string | null
          id?: number
          is_active?: boolean
          origin_description?: string | null
          title?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          created_at: string
          creator_id: string
          departure_time: string
          id: number
          observations: string | null
          occupied_seats: number
          price_per_seat: number
          status: string
          total_seats: number
          transfer_type_id: number
          vehicle_id: number
          visibility: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          departure_time: string
          id?: number
          observations?: string | null
          occupied_seats?: number
          price_per_seat: number
          status?: string
          total_seats: number
          transfer_type_id: number
          vehicle_id: number
          visibility?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          departure_time?: string
          id?: number
          observations?: string | null
          occupied_seats?: number
          price_per_seat?: number
          status?: string
          total_seats?: number
          transfer_type_id?: number
          vehicle_id?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_transfer_type_id_fkey"
            columns: ["transfer_type_id"]
            referencedRelation: "transfer_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: number
          model: string
          owner_id: string
          plate: string
          total_seats: number
          vehicle_picture_url: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: number
          model: string
          owner_id: string
          plate: string
          total_seats: number
          vehicle_picture_url?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: number
          model?: string
          owner_id?: string
          plate?: string
          total_seats?: number
          vehicle_picture_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_balance: {
        Args: {
          user_id_in: string
          amount_in: number
        }
        Returns: undefined
      }
      increment_balance: {
        Args: {
          user_id_in: string
          amount_in: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
