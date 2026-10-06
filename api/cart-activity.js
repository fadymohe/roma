import fs from 'fs';
import path from 'path';
import { getAuthenticatedSupabase, getSystemUserId } from '../lib/supabase-server.js';

const CARTS_FILE = path.join(process.cwd(), 'abandoned_carts.json');

function readCarts() {
  try {
    if (fs.existsSync(CARTS_FILE)) {
      return JSON.parse(fs.readFileSync(CARTS_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('Error reading abandoned_carts.json:', err.message);
  }
  return [];
}

function saveCarts(carts) {
  try {
    fs.writeFileSync(CARTS_FILE, JSON.stringify(carts, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving abandoned_carts.json:', err.message);
  }
}

async function syncCartToSupabase(cartData) {
  const { cleanPhone, status, items, total, customerName } = cartData;
  if (!cleanPhone || cleanPhone.length < 10) return;
  try {
    const sb = await getAuthenticatedSupabase();
    const systemUserId = getSystemUserId();
    const cartOrderNum = `CART-${cleanPhone}`;

    if (status === 'converted') {
      await sb
        .from('orders')
        .update({ status: 'converted' })
        .eq('order_number', cartOrderNum);
    } else {
      // Upsert cart_draft into orders table
      const { data: existing } = await sb
        .from('orders')
        .select('id, status')
        .eq('order_number', cartOrderNum);

      if (existing && existing.length > 0) {
        if (existing[0].status !== 'converted') {
          await sb
            .from('orders')
            .update({
              total_amount: Number(total) || 0,
              items: Array.isArray(items) ? items : [],
              customer_name: customerName || 'عميلة المتجر',
              phone: cleanPhone,
              status: 'cart_draft',
            })
            .eq('id', existing[0].id);
        }
      } else {
        await sb
          .from('orders')
          .insert({
            order_number: cartOrderNum,
            user_id: systemUserId,
            status: 'cart_draft',
            total_amount: Number(total) || 0,
            customer_name: customerName || 'عميلة المتجر',
            phone: cleanPhone,
            shipping_address: 'سلة مشتريات نشطة',
            items: Array.isArray(items) ? items : [],
          });
      }
    }
  } catch (err) {
    console.warn('Supabase cart sync note:', err.message);
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const carts = readCarts();
    return res.status(200).json({ ok: true, count: carts.length, carts: carts.slice(0, 20) });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      sessionId,
      phone = '',
      customerName = '',
      items = [],
      total = 0,
      status = 'active', // 'active', 'converted', 'cancelled'
    } = body;

    const cleanPhone = String(phone).replace(/\D+/g, '');
    const cartKey = sessionId || (cleanPhone ? `phone_${cleanPhone}` : null);

    if (!cartKey && !cleanPhone) {
      return res.status(200).json({ ok: true, ignored: 'No identifier provided' });
    }

    const carts = readCarts();
    const now = Date.now();

    const existingIndex = carts.findIndex((c) => {
      if (sessionId && c.sessionId === sessionId) return true;
      if (cleanPhone && c.cleanPhone === cleanPhone) return true;
      return false;
    });

    if (status === 'converted') {
      if (existingIndex !== -1) {
        carts[existingIndex].status = 'converted';
        carts[existingIndex].convertedAt = now;
        saveCarts(carts);
      }
      await syncCartToSupabase({ cleanPhone, status: 'converted' }).catch(() => {});
      return res.status(200).json({ ok: true, status: 'converted' });
    }

    if (existingIndex !== -1) {
      // Update existing cart activity
      const current = carts[existingIndex];
      // Only keep as active if it hasn't been completed/converted
      if (current.status !== 'converted') {
        current.phone = phone || current.phone;
        current.cleanPhone = cleanPhone || current.cleanPhone;
        current.customerName = customerName || current.customerName;
        current.items = Array.isArray(items) && items.length > 0 ? items : current.items;
        current.total = total || current.total;
        current.lastActivityAt = now;
        current.status = 'active';
      }
    } else {
      // Create new cart entry
      carts.unshift({
        id: `cart_${now}_${Math.floor(Math.random() * 1000)}`,
        sessionId: sessionId || `sess_${now}`,
        phone: phone || '',
        cleanPhone,
        customerName: customerName || 'عميلة المتجر',
        items: Array.isArray(items) ? items : [],
        total: Number(total) || 0,
        createdAt: now,
        lastActivityAt: now,
        status: 'active',
        recoverySent: false,
      });
    }

    // Keep list bounded (max 500 recent carts)
    if (carts.length > 500) {
      carts.length = 500;
    }

    saveCarts(carts);
    await syncCartToSupabase({
      cleanPhone,
      status: 'active',
      items,
      total,
      customerName,
    }).catch(() => {});

    return res.status(200).json({ ok: true, saved: true });
  } catch (err) {
    console.error('Error in /api/cart-activity:', err);
    return res.status(500).json({ error: String(err) });
  }
}
