// Em: types/database.ts

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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          cpf_cnpj: string | null
          phone: string | null
          avatar_url: string | null
          push_token: string | null
          document_url: string[] | null
          status: "incomplete" | "pending" | "approved" | "rejected"
          rejection_reason: string | null
          created_at: string
          updated_at: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          wallet_balance: number
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          cpf_cnpj?: string | null
          phone?: string | null
          avatar_url?: string | null
          push_token?: string | null
          document_url?: string[] | null
          status?: "incomplete" | "pending" | "approved" | "rejected"
          rejection_reason?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          wallet_balance?: number
        }
        Update: {
          id?: string
          full_name?: string | null
          cpf_cnpj?: string | null
          phone?: string | null
          avatar_url?: string | null
          push_token?: string | null
          document_url?: string[] | null
          status?: "incomplete" | "pending" | "approved" | "rejected"
          rejection_reason?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          wallet_balance?: number
        }
      }
      vehicles: {
        Row: {
          id: number
          owner_id: string
          model: string
          plate: string
          color: string | null
          total_seats: number
          vehicle_picture_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          owner_id: string
          model: string
          plate: string
          color?: string | null
          total_seats: number
          vehicle_picture_url?: string | null
        }
        Update: {
          id?: number
          owner_id?: string
          model?: string
          plate?: string
          color?: string | null
          total_seats?: number
          vehicle_picture_url?: string | null
        }
      }
      transfers: {
        Row: {
          id: number
          creator_id: string
          vehicle_id: number
          title: string
          origin_description: string | null
          destination_description: string | null
          departure_time: string
          total_seats: number
          occupied_seats: number
          price_per_seat: number | null
          status: "available" | "full" | "completed" | "canceled"
          visibility: "public" | "private"
          created_at: string
        }
        Insert: {
          id?: number
          creator_id: string
          vehicle_id: number
          title: string
          origin_description?: string | null
          destination_description?: string | null
          departure_time: string
          total_seats: number
          occupied_seats?: number
          price_per_seat?: number | null
          status?: "available" | "full" | "completed" | "canceled"
          visibility?: "public" | "private"
          created_at?: string
        }
        Update: {
          id?: number
          creator_id?: string
          vehicle_id?: number
          title?: string
          origin_description?: string | null
          destination_description?: string | null
          departure_time?: string
          total_seats?: number
          occupied_seats?: number
          price_per_seat?: number | null
          status?: "available" | "full" | "completed" | "canceled"
          visibility?: "public" | "private"
          created_at?: string
        }
      }
      transfer_participations: {
        Row: {
          id: number
          transfer_id: number
          participant_id: string
          seats_requested: number
          status: "pending" | "approved" | "rejected" | "paid"
          created_at: string
          total_price: number | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          id?: number
          transfer_id: number
          participant_id: string
          seats_requested: number
          status?: "pending" | "approved" | "rejected" | "paid"
          created_at?: string
          total_price?: number | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          id?: number
          transfer_id?: number
          participant_id?: string
          seats_requested?: number
          status?: "pending" | "approved" | "rejected" | "paid"
          created_at?: string
          total_price?: number | null
          stripe_payment_intent_id?: string | null
        }
      }
      reviews: {
        Row: {
          id: number
          transfer_id: number
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: number
          transfer_id: number
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          transfer_id?: number
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: number
          created_at: string
          user_id: string
          type: "earning" | "payout" | "fee"
          amount: number
          description: string
          transfer_id: number | null
          payout_id: number | null
          stripe_charge_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          type: "earning" | "payout" | "fee"
          amount: number
          description: string
          transfer_id?: number | null
          payout_id?: number | null
          stripe_charge_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          type?: "earning" | "payout" | "fee"
          amount?: number
          description?: string
          transfer_id?: number | null
          payout_id?: number | null
          stripe_charge_id?: string | null
        }
      }
      payouts: {
        Row: {
          id: number
          created_at: string
          user_id: string
          amount: number
          status: "pending" | "completed" | "failed"
          stripe_transfer_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          amount: number
          status?: "pending" | "completed" | "failed"
          stripe_transfer_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          amount?: number
          status?: "pending" | "completed" | "failed"
          stripe_transfer_id?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type Transfer = Database['public']['Tables']['transfers']['Row'];
export type TransferParticipation = Database['public']['Tables']['transfer_participations']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Payout = Database['public']['Tables']['payouts']['Row'];