import { getAuthenticatedSupabase, readLocalOrders } from '../lib/supabase-server.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const phone = req.query.phone || req.body?.phone;
    const orderNumber = req.query.orderNumber || req.query.order_number || req.body?.orderNumber;

    if (!phone && !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال رقم الهاتف أو رقم الطلب للاستعلام',
      });
    }

    const results = [];
    const seenKeys = new Set();

    // Preload local orders into fast lookup maps to enrich Supabase rows with paymentMethod and local metadata
    const localList = readLocalOrders();
    const localByNum = new Map();
    const localByPhone = new Map();
    for (const loc of localList) {
      const cleanNum = String(loc.orderNumber || loc.orderId || loc.id || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim().toLowerCase();
      if (cleanNum) localByNum.set(cleanNum, loc);
      const cleanPh = String(loc.customerPhone || loc.phone || '').replace(/\D+/g, '');
      if (cleanPh) localByPhone.set(cleanPh, loc);
    }

    const addOrder = (ord) => {
      if (!ord) return;
      const rawKey = String(ord.order_number || ord.orderNumber || ord.id || ord.orderId || '');
      const cleanKey = rawKey.replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim().toLowerCase();
      const cleanPhone = String(ord.phone || ord.customerPhone || '').replace(/\D+/g, '');

      if (!seenKeys.has(cleanKey)) {
        seenKeys.add(cleanKey);

        const localMatch = localByNum.get(cleanKey) || (cleanPhone ? localByPhone.get(cleanPhone) : null);

        let method =
          ord.payment_method ||
          ord.paymentMethod ||
          localMatch?.paymentMethod ||
          localMatch?.payment_method ||
          (Array.isArray(ord.items) && ord.items.find((it) => it && it.payment_method)?.payment_method) ||
          null;

        if (!method || method.includes('الاستلام') || /cod/i.test(method)) {
          method = 'فودافون كاش / المحافظ الإلكترونية';
        }

        results.push({
          id: ord.id || ord.orderId || cleanKey,
          order_number: ord.order_number || ord.orderNumber || rawKey,
          status: ord.status || 'pending',
          customer_name: ord.customer_name || ord.customerName || localMatch?.customerName || 'عميل المتجر',
          phone: ord.phone || ord.customerPhone || localMatch?.customerPhone || '',
          shipping_address: ord.shipping_address || ord.shippingAddress || localMatch?.shippingAddress || '',
          total_amount: Number(ord.total_amount || ord.totalAmount || localMatch?.totalAmount || 0),
          payment_method: method,
          items: Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : (Array.isArray(localMatch?.items) ? localMatch.items : []),
          created_at: ord.created_at || ord.createdAt || localMatch?.createdAt || new Date().toISOString(),
          updated_at: ord.updated_at || ord.updatedAt || localMatch?.updatedAt || null,
          tracking_url: ord.tracking_url || ord.trackingUrl || ord.shipping_tracking_url || localMatch?.tracking_url || localMatch?.trackingUrl || null,
        });
      }
    };

    // 1. Search in authoritative Supabase Database first (live real-time status)
    try {
      const sbClient = await getAuthenticatedSupabase();
      let query = sbClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (orderNumber) {
        const cleanNum = String(orderNumber).trim().replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanNum);
        if (isUuid) {
          query = query.or(`id.eq.${cleanNum},order_number.ilike.%${cleanNum}%,order_number.eq.ROMA-${cleanNum},order_number.eq.${cleanNum}`);
        } else {
          query = query.or(`order_number.eq.ROMA-${cleanNum},order_number.eq.${cleanNum},order_number.ilike.%${cleanNum}%`);
        }
      } else if (phone) {
        const cleanPhone = String(phone).replace(/\D+/g, '');
        if (cleanPhone.length >= 8) {
          query = query.ilike('phone', `%${cleanPhone}%`);
        }
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          addOrder(row);
        }
      }
    } catch (sbErr) {
      console.warn('Track order Supabase search note:', sbErr.message);
    }

    // 2. Fallback to local orders.json only for records not found in Supabase
    try {
      const localList = readLocalOrders();
      for (const loc of localList) {
        if (orderNumber) {
          const cleanTarget = String(orderNumber).trim().toLowerCase().replace(/^#+/g, '').replace(/^(roma-)+/gi, '');
          const locNum = String(loc.orderNumber || loc.orderId || '').toLowerCase().replace(/^#+/g, '').replace(/^(roma-)+/gi, '');
          if (locNum.includes(cleanTarget) || cleanTarget.includes(locNum)) {
            addOrder(loc);
          }
        } else if (phone) {
          const cleanTargetPhone = String(phone).replace(/\D+/g, '');
          const locPhone = String(loc.customerPhone || loc.phone || '').replace(/\D+/g, '');
          if (locPhone.includes(cleanTargetPhone) || cleanTargetPhone.includes(locPhone)) {
            addOrder(loc);
          }
        }
      }
    } catch (locErr) {
      console.warn('Track order local search note:', locErr.message);
    }

    return res.status(200).json({
      success: true,
      orders: results,
    });
  } catch (err) {
    console.error('Track order handler error:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
