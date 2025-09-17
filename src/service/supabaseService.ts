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
  name: string
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
  is_completed: boolean
}

export interface LocationWithItems {
  id: number
  name: string
  outlets: Array<{
    id: number
    name: string
    items: Array<{
      id: number
      name: string
      available_quantity: number
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
          name,
          outlets (
            id,
            name,
            items (
              id,
              name,
              available_quantity
            )
          )
        `)
        .order('id')

      if (locationsError) {
        console.error('Error fetching locations:', locationsError)
        throw locationsError
      }

      return locations as LocationWithItems[]
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
          name,
          outlets (
            id,
            name,
            items (
              id,
              name,
              available_quantity
            )
          )
        `)
        .eq('id', locationId)
        .single()

      if (error) {
        console.error('Error fetching location:', error)
        return null
      }

      return location as LocationWithItems
    } catch (error) {
      console.error('Error in getLocationWithItems:', error)
      return null
    }
  }

  // Update item quantity (when user selects an item)
  static async updateItemQuantity(itemId: number, newQuantity: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('items')
        .update({ available_quantity: newQuantity })
        .eq('id', itemId)

      if (error) {
        console.error('Error updating item quantity:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateItemQuantity:', error)
      return false
    }
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
          is_completed: false
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
    outlet_name?: string;
    item_name?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('user_selections')
        .select(`
          *,
          locations!inner(name),
          outlets!inner(name),
          items!inner(name)
        `)
        .eq('mobile_number', mobileNumber)
        .eq('is_completed', false)
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
        location_name: data.locations?.name,
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
        .update({ is_completed: true })
        .eq('mobile_number', mobileNumber)
        .eq('is_completed', false)

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

  // Check if user is returning (has any previous selections)
  static async isReturningUser(mobileNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_selections')
        .select('id')
        .eq('mobile_number', mobileNumber)
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
        .eq('is_completed', true)
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
      // Get the incomplete selection to restore item quantity
      const { data: incompleteSelection, error: fetchError } = await supabase
        .from('user_selections')
        .select('item_id')
        .eq('mobile_number', mobileNumber)
        .eq('is_completed', false)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching incomplete selection:', fetchError)
        return false
      }

      // Delete incomplete selection
      const { error: deleteError } = await supabase
        .from('user_selections')
        .delete()
        .eq('mobile_number', mobileNumber)
        .eq('is_completed', false)

      if (deleteError) {
        console.error('Error deleting incomplete selection:', deleteError)
        return false
      }

      // Restore item quantity if there was an incomplete selection
      if (incompleteSelection) {
        const { data: item, error: itemError } = await supabase
          .from('items')
          .select('available_quantity')
          .eq('id', incompleteSelection.item_id)
          .single()

        if (!itemError && item) {
          await supabase
            .from('items')
            .update({ available_quantity: item.available_quantity + 1 })
            .eq('id', incompleteSelection.item_id)
        }
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
    is_completed: boolean;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_selections')
        .select(`
          id,
          mobile_number,
          selected_at,
          is_completed,
          screenshot_url,
          screenshot_uploaded_at,
          locations!inner(name),
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
        location_name: selection.locations?.name || 'Unknown',
        outlet_name: selection.outlets?.name || 'Unknown',
        item_name: selection.items?.name || 'Unknown',
        screenshot_url: selection.screenshot_url,
        screenshot_uploaded_at: selection.screenshot_uploaded_at,
        selected_at: selection.selected_at,
        is_completed: selection.is_completed
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
        supabase.from('user_selections').select('*', { count: 'exact', head: true }).eq('is_completed', true),
        supabase.from('user_selections').select('*', { count: 'exact', head: true }).eq('is_completed', false),
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
        .eq('is_completed', false)

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
