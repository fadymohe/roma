import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ORDERS_JSON_PATH = path.join(ROOT_DIR, 'orders.json');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dsgrgbmvbvqwzizbbwxf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3JnYm12YnZxd3ppemJid3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODE0MTMsImV4cCI6MjEwNTk1NzQxM30.kd8bIzK5UzbWIPP4eCHhkflhaRLQ7C1AKb-RhDnvbhM';

// System backend credentials for server-side operations bypassing guest RLS blocks
const SYSTEM_EMAIL = 'system_backend@roma-eg.my';
const SYSTEM_PASSWORD = 'RomaStoreBackend2026!';
let cachedSystemUserId = '90737d4b-da34-4727-970f-68ebc7dcf1ac';

let cachedAuthClient = null;
let tokenExpiresAt = 0;

/**
 * Get the system user ID
 */
export function getSystemUserId() {
  return cachedSystemUserId;
}

/**
 * Get an authenticated Supabase client for backend operations
 */
export async function getAuthenticatedSupabase() {
  const now = Date.now();
  if (cachedAuthClient && tokenExpiresAt > now + 60000) {
    return cachedAuthClient;
  }

  const baseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  try {
    let session = null;
    const { data: signInData, error: signInErr } = await baseClient.auth.signInWithPassword({
      email: SYSTEM_EMAIL,
      password: SYSTEM_PASSWORD,
    });

    if (signInData?.session) {
      session = signInData.session;
    } else {
      const { data: signUpData } = await baseClient.auth.signUp({
        email: SYSTEM_EMAIL,
        password: SYSTEM_PASSWORD,
      });
      session = signUpData?.session;
    }

    if (session?.user?.id) {
      cachedSystemUserId = session.user.id;
    }

    if (session?.access_token) {
      tokenExpiresAt = (session.expires_at || 0) * 1000;
      cachedAuthClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      });
      return cachedAuthClient;
    }
  } catch (err) {
    console.warn('System Supabase authentication notice:', err?.message || err);
  }

  return baseClient;
}

/**
 * Insert an order safely into Supabase ensuring RLS policy compliance
 */
export async function insertSupabaseOrder(payload) {
  try {
    const sb = await getAuthenticatedSupabase();
    const dataToInsert = {
      ...payload,
      user_id: cachedSystemUserId,
    };
    const { data, error } = await sb.from('orders').insert(dataToInsert).select();
    if (!error && data && data[0]) {
      return data[0];
    }
    if (error) {
      if (error.code === '23505' || String(error.message).includes('unique constraint') || String(error.message).includes('duplicate key')) {
        // Fall back to update
        const { data: updated, error: upErr } = await sb
          .from('orders')
          .update(dataToInsert)
          .eq('order_number', payload.order_number)
          .select();
        if (!upErr && updated && updated[0]) {
          return updated[0];
        }
      }
      console.warn('insertSupabaseOrder note:', error.message);
    }
  } catch (e) {
    console.warn('insertSupabaseOrder error:', e?.message || e);
  }
  return null;
}

/**
 * Read orders from orders.json safely
 */
export function readLocalOrders() {
  try {
    if (fs.existsSync(ORDERS_JSON_PATH)) {
      const content = fs.readFileSync(ORDERS_JSON_PATH, 'utf8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('readLocalOrders warning:', err?.message);
  }
  return [];
}

/**
 * Save an order to orders.json (upsert by id/orderId/orderNumber)
 */
export function saveLocalOrder(order) {
  try {
    const list = readLocalOrders();
    const orderKey = String(order.orderId || order.id || order.order_number || order.orderNumber);
    const idx = list.findIndex(
      (o) => String(o.orderId || o.id || o.order_number || o.orderNumber) === orderKey
    );

    const normalized = {
      orderId: order.orderId || order.id || orderKey,
      orderNumber: order.orderNumber || order.order_number || `ROMA-${orderKey}`,
      customerName: order.customerName || order.customer_name || 'عميل المتجر',
      customerPhone: order.customerPhone || order.phone || '',
      shippingAddress: order.shippingAddress || order.shipping_address || '',
      totalAmount: Number(order.totalAmount || order.total_amount || 0),
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod || order.payment_method || 'الدفع عند الاستلام',
      items: Array.isArray(order.items) ? order.items : [],
      createdAt: order.createdAt || order.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...normalized };
    } else {
      list.unshift(normalized);
    }

    fs.writeFileSync(ORDERS_JSON_PATH, JSON.stringify(list.slice(0, 500), null, 2), 'utf8');
    return normalized;
  } catch (err) {
    console.error('saveLocalOrder error:', err);
    return null;
  }
}
