import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kvfayuixdurnrupkgnsi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZmF5dWl4ZHVybnJ1cGtnbnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDAxMDcsImV4cCI6MjA3MzcxNjEwN30.StH4YHmSxaCQpY5jzB-SOXDdfIu8PoimUoUux2E_V7Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Zone {
  id: number
  name: string
  description: string
  created_at: string
}

export interface Outlet {
  id: number
  name: string
  address_line_1: string
  main_street: string
  zone_id: number
  max_order_amount: number
  is_active: boolean
  created_at: string
}

export interface UserSelection {
  id: string
  mobile_number: string
  zone_id: number
  outlet_id: number
  selected_item: string
  order_amount: number
  screenshot_url?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  name: string
  price: number
  outlet_id: number
  is_available: boolean
  created_at: string
}
