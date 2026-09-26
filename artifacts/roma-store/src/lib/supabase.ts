import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://dsgrgbmvbvqwzizbbwxf.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3JnYm12YnZxd3ppemJid3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODE0MTMsImV4cCI6MjEwNTk1NzQxM30.kd8bIzK5UzbWIPP4eCHhkflhaRLQ7C1AKb-RhDnvbhM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseOrderPayload {
  user_id?: string | null;
  status: string;
  total_amount: number;
  customer_name: string;
  phone: string;
  shipping_address: string;
  items: Array<{
    product_id?: number | string;
    name: string;
    price: number;
    quantity: number;
    variant?: string | null;
    image?: string;
  }>;
}

/**
 * Upload order to Supabase orders table with error-safe handling
 */
export async function uploadOrderToSupabase(payload: SupabaseOrderPayload) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: payload.user_id || null,
        status: payload.status || 'pending',
        total_amount: payload.total_amount,
        customer_name: payload.customer_name,
        phone: payload.phone,
        shipping_address: payload.shipping_address,
        items: payload.items,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase order upload note:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase order upload exception:', err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * Sync user cart items to Supabase
 */
export async function syncCartToSupabase(userId: string, cartLines: any[]) {
  if (!userId) return;
  try {
    // Delete previous cart items for this user
    await supabase.from('cart_items').delete().eq('user_id', userId);

    if (cartLines.length > 0) {
      const records = cartLines.map((line) => ({
        user_id: userId,
        product_id: line.product.id,
        quantity: line.quantity,
      }));
      await supabase.from('cart_items').insert(records);
    }
  } catch (e) {
    console.warn('Cart sync note:', e);
  }
}

/**
 * Fetch cart items for a user from Supabase
 */
export async function fetchCartFromSupabase(userId: string) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn('Fetch cart error:', e);
  }
  return [];
}
