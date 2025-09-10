import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if environment variables are available
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          company: string | null
          delivery_address: Record<string, unknown>
          order_notes: string | null
          payment_method: string
          subtotal: number
          tax_amount: number
          delivery_fee: number
          total_amount: number
          order_status: string
          payment_status: string
          estimated_delivery_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          company?: string | null
          delivery_address: Record<string, unknown>
          order_notes?: string | null
          payment_method?: string
          subtotal?: number
          tax_amount?: number
          delivery_fee?: number
          total_amount?: number
          order_status?: string
          payment_status?: string
          estimated_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          company?: string | null
          delivery_address?: Record<string, unknown>
          order_notes?: string | null
          payment_method?: string
          subtotal?: number
          tax_amount?: number
          delivery_fee?: number
          total_amount?: number
          order_status?: string
          payment_status?: string
          estimated_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_type: string
          item_id: string
          item_name: string
          item_description: string | null
          quantity: number
          unit_price: number
          total_price: number
          customizations: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          item_type: string
          item_id: string
          item_name: string
          item_description?: string | null
          quantity?: number
          unit_price: number
          total_price: number
          customizations?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          item_type?: string
          item_id?: string
          item_name?: string
          item_description?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          customizations?: Record<string, unknown>
          created_at?: string
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
    }
  }
}
