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
      saved_groups: {
        Row: {
          id: string
          user_id: string
          name: string
          participants: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          participants: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          participants?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      constraints: {
        Row: {
          id: string
          group_id: string
          person_a: string
          person_b: string
          constraint_type: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          person_a: string
          person_b: string
          constraint_type: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          person_a?: string
          person_b?: string
          constraint_type?: string
          created_at?: string
        }
      }
      grouping_sessions: {
        Row: {
          id: string
          group_id: string
          session_date: string
          groups_data: Json
          participants_count: number
        }
        Insert: {
          id?: string
          group_id: string
          session_date?: string
          groups_data: Json
          participants_count: number
        }
        Update: {
          id?: string
          group_id?: string
          session_date?: string
          groups_data?: Json
          participants_count?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}