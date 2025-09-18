import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database
export interface Location {
  id: number
  area_name: string
  house_no: string
  apartment: string
  receiver_mobile: string
  created_at: string
  updated_at: string
}

export interface Outlet {
  id: number
  name: string
  location_id: number
  created_at: string
  updated_at: string
}

export interface Item {
  id: number
  name: string
  outlet_id: number
  per_order_quantity: number
  no_of_users: number
  available_quantity: number
  created_at: string
  updated_at: string
}

export interface UserSelection {
  id: number
  mobile_number: string
  location_id: number
  outlet_id: number
  item_id: number
  screenshot_url?: string
  screenshot_uploaded_at?: string
  selected_at: string
  status: 'pending' | 'completed' | 'expired'
  expires_at?: string
  locked_quantity: number
}

export interface LocationWithItems {
  id: number
  name: string
  area_name?: string
  house_no?: string
  apartment?: string
  receiver_mobile?: string
  outlets: Array<{
    id: number
    name: string
    items: Array<{
      id: number
      name: string
      available_quantity: number
      no_of_users?: number
      per_order_quantity?: number
    }>
  }>
}

// Service functions
export class SupabaseService {
  // Get all locations with their outlets and items
  static async getLocationsWithItems(): Promise<LocationWithItems[]> {
    try {
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select(`
          id,
          area_name,
          house_no,
          apartment,
          receiver_mobile,
          outlets (
            id,
            name,
            items (
              id,
              name,
              available_quantity,
              no_of_users,
              per_order_quantity
            )
          )
        `)
        .order('id')

      if (locationsError) {
        console.error('Error fetching locations:', locationsError)
        throw locationsError
      }

      // Map to expected shape with a synthesized human-readable name
      return (locations || []).map((loc: { id: number; area_name: string; house_no?: string; apartment?: string; receiver_mobile?: string; outlets?: Array<{ id: number; name: string; items?: Array<any> }>; }) => ({
        id: loc.id,
        name: `${loc.area_name}`,
        area_name: loc.area_name,
        house_no: loc.house_no,
        apartment: loc.apartment,
        receiver_mobile: loc.receiver_mobile,
        outlets: (loc.outlets || []).map((o: { id: number; name: string; items?: Array<any> }) => ({
          id: o.id,
          name: o.name,
          items: (o.items || []).map((it: { id: number; name: string; available_quantity: number; no_of_users: number; per_order_quantity: number; }) => ({
            id: it.id,
            name: it.name,
            available_quantity: it.available_quantity,
            no_of_users: it.no_of_users,
            per_order_quantity: it.per_order_quantity
          }))
        }))
      })) as LocationWithItems[]
    } catch (error) {
      console.error('Error in getLocationsWithItems:', error)
      throw error
    }
  }

  // Get a specific location with its outlets and items
  static async getLocationWithItems(locationId: number): Promise<LocationWithItems | null> {
    try {
      const { data: location, error } = await supabase
        .from('locations')
        .select(`
          id,
          area_name,
          house_no,
          apartment,
          receiver_mobile,
          outlets (
            id,
            name,
            items (
              id,
              name,
              available_quantity,
              no_of_users,
              per_order_quantity
            )
          )
        `)
        .eq('id', locationId)
        .single()

      if (error) {
        console.error('Error fetching location:', error)
        return null
      }

      if (!location) {
        return null
      }
      return {
        id: location.id,
        name: `${location.area_name}`,
        area_name: location.area_name,
        house_no: location.house_no,
        apartment: location.apartment,
        receiver_mobile: location.receiver_mobile,
        outlets: (location.outlets || []).map((o: { id: number; name: string; items?: Array<{ id: number; name: string; available_quantity: number; no_of_users: number; per_order_quantity: number; }>; }) => ({
          id: o.id,
          name: o.name,
          items: (o.items || []).map((it: { id: number; name: string; available_quantity: number; no_of_users: number; per_order_quantity: number; }) => ({
            id: it.id,
            name: it.name,
            available_quantity: it.available_quantity,
            no_of_users: it.no_of_users,
            per_order_quantity: it.per_order_quantity
          }))
        }))
      }
    } catch (error) {
      console.error('Error in getLocationWithItems:', error)
      return null
    }
  }

  // Deprecated: Directly updating available_quantity is no longer supported.
  // Quantity is reserved via inserting into user_selections (triggers handle stock).
  static async updateItemQuantity(_itemId: number, _newQuantity: number): Promise<boolean> {
    console.warn('updateItemQuantity is deprecated. Reservation is handled via user_selections triggers.')
    return true
  }

  // Save user selection
  static async saveUserSelection(
    mobileNumber: string,
    locationId: number,
    outletId: number,
    itemId: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_selections')
        .insert({
          mobile_number: mobileNumber,
          location_id: locationId,
          outlet_id: outletId,
          item_id: itemId,
          status: 'pending'
        })

      if (error) {
        console.error('Error saving user selection:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveUserSelection:', error)
      return false
    }
  }

  // Get user's previous selection with location, outlet, and item names
  static async getUserSelection(mobileNumber: string): Promise<{
    location_name?: string;
    area_name?: string;
    house_no?: string;
    apartment?: string;
    receiver_mobile?: string;
    outlet_name?: string;
    item_name?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('user_selections')
        .select(`
          *,
          locations!inner(area_name, house_no, apartment, receiver_mobile),
          outlets!inner(name),
          items!inner(name)
        `)
        .eq('mobile_number', mobileNumber)
        .eq('status', 'pending')
        .order('selected_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching user selection:', error)
        return null
      }

      // Transform the data to include names
      return {
        ...data,
        location_name: data.locations?.area_name,
        area_name: data.locations?.area_name,
        house_no: data.locations?.house_no,
        apartment: data.locations?.apartment,
        receiver_mobile: data.locations?.receiver_mobile,
        outlet_name: data.outlets?.name,
        item_name: data.items?.name
      }
    } catch (error) {
      console.error('Error in getUserSelection:', error)
      return null
    }
  }

  // Mark user selection as completed
  static async markSelectionCompleted(mobileNumber: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_selections')
        .update({ status: 'completed' })
        .eq('mobile_number', mobileNumber)
        .eq('status', 'pending')

      if (error) {
        console.error('Error marking selection as completed:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in markSelectionCompleted:', error)
      return false
    }
  }

  // Restore item quantity if user abandons upload (timeout mechanism)
  static async restoreItemQuantity(itemId: number, _quantityToRestore: number): Promise<boolean> {
    try {
      // With new schema, stock is managed via triggers on user_selections.
      // To restore, expire any pending reservations for this item
      // created by the current user/session policy upstream.
      const { error } = await supabase
        .from('user_selections')
        .update({ status: 'expired' })
        .eq('item_id', itemId)
        .eq('status', 'pending')

      if (error) {
        console.error('Error restoring item quantity:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in restoreItemQuantity:', error)
      return false
    }
  }

  // Check if user is returning (has any previous selections)
  static async isReturningUser(mobileNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_selections')
        .select('id')
        .eq('mobile_number', mobileNumber)
        .limit(1)
        .limit(1)

      if (error) {
        console.error('Error checking returning user:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error in isReturningUser:', error)
      return false
    }
  }

  // Check if user has already completed an order
  static async hasCompletedOrder(mobileNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_selections')
        .select('id')
        .eq('mobile_number', mobileNumber)
        .eq('status', 'completed')
        .limit(1)

      if (error) {
        console.error('Error checking completed order:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error in hasCompletedOrder:', error)
      return false
    }
  }

  // Clear user's incomplete session data (for changing choices)
  static async clearIncompleteSession(mobileNumber: string): Promise<boolean> {
    try {
      // Delete pending selection (triggers in DB will restore stock)
      const { error: deleteError } = await supabase
        .from('user_selections')
        .delete()
        .eq('mobile_number', mobileNumber)
        .eq('status', 'pending')

      if (deleteError) {
        console.error('Error deleting incomplete selection:', deleteError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in clearIncompleteSession:', error)
      return false
    }
  }

  // Admin function: Get all user selections with details
  static async getAllUserSelections(): Promise<Array<{
    id: number;
    mobile_number: string;
    location_name: string;
    outlet_name: string;
    item_name: string;
    screenshot_url?: string;
    screenshot_uploaded_at?: string;
    selected_at: string;
    status: 'pending' | 'completed' | 'expired';
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_selections')
        .select(`
          id,
          mobile_number,
          selected_at,
          status,
          screenshot_url,
          screenshot_uploaded_at,
          locations!inner(area_name),
          outlets!inner(name),
          items!inner(name)
        `)
        .order('selected_at', { ascending: false })

      if (error) {
        console.error('Error fetching all user selections:', error)
        throw error
      }

      // Transform the data to include names
      return data.map((selection: any) => ({
        id: selection.id,
        mobile_number: selection.mobile_number,
        location_name: selection.locations?.area_name || 'Unknown',
        outlet_name: selection.outlets?.name || 'Unknown',
        item_name: selection.items?.name || 'Unknown',
        screenshot_url: selection.screenshot_url,
        screenshot_uploaded_at: selection.screenshot_uploaded_at,
        selected_at: selection.selected_at,
        status: selection.status
      }))
    } catch (error) {
      console.error('Error in getAllUserSelections:', error)
      throw error
    }
  }

  // Admin function: Get statistics
  static async getAdminStats(): Promise<{
    totalSelections: number;
    completedOrders: number;
    pendingOrders: number;
    totalLocations: number;
    totalOutlets: number;
    totalItems: number;
  }> {
    try {
      const [
        { count: totalSelections },
        { count: completedOrders },
        { count: pendingOrders },
        { count: totalLocations },
        { count: totalOutlets },
        { count: totalItems }
      ] = await Promise.all([
        supabase.from('user_selections').select('*', { count: 'exact', head: true }),
        supabase.from('user_selections').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('user_selections').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('locations').select('*', { count: 'exact', head: true }),
        supabase.from('outlets').select('*', { count: 'exact', head: true }),
        supabase.from('items').select('*', { count: 'exact', head: true })
      ])

      return {
        totalSelections: totalSelections || 0,
        completedOrders: completedOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalLocations: totalLocations || 0,
        totalOutlets: totalOutlets || 0,
        totalItems: totalItems || 0
      }
    } catch (error) {
      console.error('Error in getAdminStats:', error)
      throw error
    }
  }

  // Upload screenshot to Supabase Storage
  static async uploadScreenshot(file: File, mobileNumber: string): Promise<boolean> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${mobileNumber}_${Date.now()}.${fileExt}`
      const filePath = `screenshots/${fileName}`

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading screenshot:', error)
        return false
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(filePath)

      // Update user selection with screenshot URL
      const { error: updateError } = await supabase
        .from('user_selections')
        .update({ 
          screenshot_url: urlData.publicUrl,
          screenshot_uploaded_at: new Date().toISOString()
        })
        .eq('mobile_number', mobileNumber)
        .eq('status', 'pending')

      if (updateError) {
        console.error('Error updating screenshot URL:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in uploadScreenshot:', error)
      return false
    }
  }
}
