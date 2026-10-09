import { getAuthenticatedSupabase, readLocalOrders } from '../lib/supabase-server.js';

// Rate Limiting: 25 requests per 10 minutes per IP
const ipRateLimits = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ipRateLimits) if (now > v.resetAt) ipRateLimits.delete(k);
}, 10 * 60 * 1000).unref?.();

function getTrustedClientIp(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipRateLimits.get(ip) || { count: 0, resetAt: now + 10 * 60 * 1000 };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + 10 * 60 * 1000;
  } else {
    entry.count += 1;
  }
  ipRateLimits.set(ip, entry);
  return entry.count <= 25;
}

// Data Masking function: Protects customer's privacy against scraping
function maskAddress(addr = '') {
  const clean = String(addr || '').trim();
  if (!clean) return 'العنوان مسجل ومحمي';
  // If address has governorate/city keywords, preserve the city but mask detailed street/building
  const parts = clean.split(/[-–,،]/);
  if (parts.length > 1) {
    return `${parts[0].trim()} (العنوان التفصيلي محمي)`;
  }
  return clean.length > 12 ? `${clean.slice(0, 10)}... (محمي)` : clean;
}

function maskPhone(ph = '') {
  const digits = String(ph).replace(/\D+/g, '');
  if (digits.length >= 8) {
    return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
  }
  return '010****';
}

export default async function handler(req, res) {
  // Strict CORS protection
  const allowedOrigins = [
    'https://roma-eg.my',
    'https://www.roma-eg.my',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://roma-eg.my');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp = getTrustedClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'تم تجاوز الحد المسموح للاستعلامات. يرجى الانتظار بضع دقائق.',
    });
  }

  try {
    const rawPhone = req.query.phone || req.body?.phone;
    const rawOrderNum = req.query.orderNumber || req.query.order_number || req.body?.orderNumber;

    if (!rawPhone && !rawOrderNum) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال رقم الهاتف أو رقم الطلب للاستعلام',
      });
    }

    const cleanOrderNumber = rawOrderNum
      ? String(rawOrderNum).trim().replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '')
      : null;
    const cleanPhone = rawPhone ? String(rawPhone).replace(/\D+/g, '') : null;

    if (cleanPhone && cleanPhone.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف غير صالح',
      });
    }

    const results = [];
    const seenKeys = new Set();

    const addOrder = (ord) => {
      if (!ord) return;
      const rawKey = String(ord.order_number || ord.orderNumber || ord.id || ord.orderId || '');
      const cleanKey = rawKey.replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim().toLowerCase();

      if (!seenKeys.has(cleanKey)) {
        seenKeys.add(cleanKey);

        let method = ord.payment_method || ord.paymentMethod || 'فودافون كاش / المحافظ الإلكترونية';
        let extractedTracking = ord.tracking_url || ord.trackingUrl || null;

        const rawAddr = String(ord.shipping_address || ord.shippingAddress || '');
        const trackMatch = rawAddr.match(/\[TRACK:([^\]]+)\]/i);
        if (!extractedTracking && trackMatch && trackMatch[1]) {
          extractedTracking = trackMatch[1].trim();
        }

        results.push({
          id: ord.id || ord.orderId || cleanKey,
          order_number: ord.order_number || ord.orderNumber || rawKey,
          status: ord.status || 'pending',
          customer_name: ord.customer_name || ord.customerName || 'عميل المتجر',
          phone: maskPhone(ord.phone || ord.customerPhone),
          shipping_address: maskAddress(rawAddr.replace(/\s*\[TRACK:.*?\]/gi, '').trim()),
          total_amount: Number(ord.total_amount || ord.totalAmount || 0),
          payment_method: method,
          items: Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [],
          created_at: ord.created_at || ord.createdAt || new Date().toISOString(),
          updated_at: ord.updated_at || ord.updatedAt || null,
          tracking_url: extractedTracking,
        });
      }
    };

    // 1. Authoritative Supabase Database query
    try {
      const sbClient = await getAuthenticatedSupabase();
      let query = sbClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (cleanOrderNumber) {
        query = query.or(`order_number.eq.ROMA-${cleanOrderNumber},order_number.eq.${cleanOrderNumber},order_number.ilike.%${cleanOrderNumber}%`);
      } else if (cleanPhone) {
        query = query.ilike('phone', `%${cleanPhone.slice(-8)}%`);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          addOrder(row);
        }
      }
    } catch (sbErr) {
      console.warn('[TRACK-ORDER] Supabase note:', sbErr?.message);
    }

    // 2. Fallback to local orders only if no match found
    if (results.length === 0) {
      try {
        const localList = readLocalOrders();
        for (const loc of localList) {
          if (cleanOrderNumber) {
            const locNum = String(loc.orderNumber || loc.orderId || '').toLowerCase().replace(/^#+/g, '').replace(/^(roma-)+/gi, '');
            if (locNum.includes(cleanOrderNumber.toLowerCase()) || cleanOrderNumber.toLowerCase().includes(locNum)) {
              addOrder(loc);
            }
          } else if (cleanPhone) {
            const locPhone = String(loc.customerPhone || loc.phone || '').replace(/\D+/g, '');
            if (locPhone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(locPhone.slice(-8))) {
              addOrder(loc);
            }
          }
        }
      } catch (locErr) {
        console.warn('[TRACK-ORDER] Local fallback note:', locErr?.message);
      }
    }

    return res.status(200).json({
      success: true,
      orders: results,
    });
  } catch (err) {
    console.error('[TRACK-ORDER] Handler error:', err?.message);
    return res.status(500).json({ success: false, error: 'حدث خطأ في النظام أثناء معالجة الطلب.' });
  }
}
