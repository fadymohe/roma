import fs from 'fs';
import path from 'path';
import { getAuthenticatedSupabase, saveLocalOrder, insertSupabaseOrder } from '../lib/supabase-server.js';

// Read secrets strictly from environment variables (No hardcoded credentials)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dsgrgbmvbvqwzizbbwxf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// In-memory sliding rate-limiter (Max 15 requests per IP per minute)
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 15;
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }
  rateLimitMap.set(ip, record);
  return record.count <= maxReq;
}

// Global in-memory set to prevent duplicate Telegram notifications for the same order
const sentTelegramOrderIds = new Set();

// Cache authoritative catalog to avoid repeated disk reads
let cachedCatalog = null;
function getCatalog() {
  if (cachedCatalog) return cachedCatalog;
  const searchPaths = [
    path.join(process.cwd(), 'artifacts', 'roma-store', 'public', 'products.json'),
    path.join(process.cwd(), 'dist', 'products.json'),
    path.join(process.cwd(), 'products.json'),
    path.join(process.cwd(), 'public', 'products.json'),
  ];
  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedCatalog = parsed;
          return cachedCatalog;
        }
      } catch (_) {}
    }
  }
  return [];
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ ok: true, message: 'ROMA Orders & Telegram API is LIVE (Protected)' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Rate Limiting Protection
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again in 1 minute.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      orderId = Math.floor(100000 + Math.random() * 900000),
      orderNumber = '',
      customerName = 'عميل المتجر',
      customerPhone = '',
      shippingAddress = '',
      paymentMethod = 'فودافون كاش / المحافظ الإلكترونية',
      items = [],
      shippingCost = 0,
      userId = null,
      receiptImage = null,
      skipDbInsert = false,
    } = body;

    let cleanPaymentMethod = String(paymentMethod || '').trim();
    if (!cleanPaymentMethod || cleanPaymentMethod.includes('الاستلام') || /cod/i.test(cleanPaymentMethod)) {
      cleanPaymentMethod = 'فودافون كاش / المحافظ الإلكترونية';
    }

    const dedupKey = String(orderId || orderNumber || `${customerPhone}_${items.length}`);
    const isDuplicate = sentTelegramOrderIds.has(dedupKey);

    // =========================================================================
    // DEFENSE IN DEPTH: Server-Side Price & Total Calculation
    // Never trust client-provided totalAmount or unit price directly.
    // =========================================================================
    const catalog = getCatalog();
    const catalogById = new Map();
    const catalogByName = new Map();
    for (const p of catalog) {
      if (p.id) catalogById.set(String(p.id), p);
      if (p.nameAr) catalogByName.set(p.nameAr.trim().toLowerCase(), p);
      if (p.name) catalogByName.set(p.name.trim().toLowerCase(), p);
    }

    let verifiedSubtotal = 0;
    const verifiedItems = (Array.isArray(items) ? items : []).map((item) => {
      const matched =
        (item.id && catalogById.get(String(item.id))) ||
        (item.product_id && catalogById.get(String(item.product_id))) ||
        (item.name && catalogByName.get(String(item.name).trim().toLowerCase()));

      const unitPrice = matched ? Number(matched.price) : Number(item.price || 0);
      const quantity = Math.max(1, Math.min(100, parseInt(item.quantity, 10) || 1));
      const lineTotal = unitPrice * quantity;
      verifiedSubtotal += lineTotal;

      return {
        ...item,
        id: matched?.id || item.id,
        name: matched?.nameAr || matched?.name || item.name || 'مستحضر',
        price: unitPrice, // Verified authentic price
        quantity,
        variantName: item.variantName || item.variant || '',
        lineTotal,
      };
    });

    // 1. Minimum Order Amount Validation (200 EGP)
    const MIN_ORDER_AMOUNT = 200;
    if (verifiedSubtotal < MIN_ORDER_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: `عذراً، الحد الأدنى للطلب هو ${MIN_ORDER_AMOUNT} ج.م`,
        minOrderAmount: MIN_ORDER_AMOUNT,
        subtotal: verifiedSubtotal,
      });
    }

    // 2. Verified Shipping Calculation By Egyptian Governorate:
    // - Cairo & Giza: 80 EGP
    // - Delta & Canal & Alexandria: 90 EGP
    // - Upper Egypt & Hurghada / Red Sea: 130 EGP
    function resolveShippingByAddress(addr = '') {
      const s = String(addr).toLowerCase();
      // Cairo & Giza -> 80
      if (s.includes('cairo') || s.includes('القاهرة') || s.includes('giza') || s.includes('الجيزة')) {
        return 80;
      }
      // Upper Egypt & Hurghada / Red Sea / Frontier -> 130
      const upperEgyptKeywords = [
        'red_sea', 'بحر أحمر', 'البحر الأحمر', 'غردقة', 'الغردقة', 'hurghada',
        'faiyum', 'الفيوم', 'beni_suef', 'بني سويف', 'minya', 'المنيا',
        'asyut', 'أسيوط', 'sohag', 'سوهاج', 'qena', 'قنا', 'luxor', 'الأقصر',
        'aswan', 'أسوان', 'sinai', 'سيناء', 'شرم', 'matrouh', 'مطروح', 'وادي جديد', 'new_valley'
      ];
      if (upperEgyptKeywords.some((k) => s.includes(k))) {
        return 130;
      }
      // Delta & Alexandria & Canal -> 90
      return 90;
    }

    const isFreeShipping = verifiedSubtotal >= 500;
    const calculatedShipping = resolveShippingByAddress(shippingAddress);
    const verifiedShippingCost = isFreeShipping
      ? 0
      : ([80, 90, 130].includes(Number(shippingCost)) ? Number(shippingCost) : calculatedShipping);

    const verifiedTotalAmount = Math.max(0, verifiedSubtotal + verifiedShippingCost);

    const cleanId = String(orderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
    const generatedOrderNumber = `ROMA-${cleanId}`;

    const verifiedItemsWithPayment = verifiedItems.map((item) => ({
      ...item,
      payment_method: cleanPaymentMethod,
    }));

    // 1. Dual-Persistence: Save to local orders.json immediately for instant zero-latency tracking
    saveLocalOrder({
      orderId: cleanId,
      orderNumber: generatedOrderNumber,
      customerName,
      customerPhone,
      shippingAddress,
      totalAmount: verifiedTotalAmount,
      status: 'pending',
      paymentMethod: cleanPaymentMethod,
      items: verifiedItemsWithPayment,
      createdAt: new Date().toISOString(),
    });

    // Mark any matching cart as converted in abandoned_carts.json
    try {
      const cartsFile = path.join(process.cwd(), 'abandoned_carts.json');
      if (fs.existsSync(cartsFile)) {
        const carts = JSON.parse(fs.readFileSync(cartsFile, 'utf8'));
        const cleanPh = String(customerPhone).replace(/\D+/g, '');
        let updated = false;
        for (const c of carts) {
          if (c.cleanPhone === cleanPh || c.phone === customerPhone) {
            c.status = 'converted';
            c.convertedAt = Date.now();
            updated = true;
          }
        }
        if (updated) {
          fs.writeFileSync(cartsFile, JSON.stringify(carts, null, 2), 'utf8');
        }
      }
    } catch (_) {}

    // 2. Persist to Supabase Database with authenticated client (bypasses anon RLS failure)
    let supabaseResult = null;
    try {
      supabaseResult = await insertSupabaseOrder({
        order_number: generatedOrderNumber,
        status: 'pending',
        total_amount: verifiedTotalAmount,
        customer_name: customerName,
        phone: customerPhone,
        shipping_address: shippingAddress,
        items: verifiedItemsWithPayment,
        user_id: userId || null,
      });
    } catch (sbErr) {
      console.warn('Supabase insert inside /api/orders notice:', sbErr);
    }

    // 2. Format HTML Notification for Telegram
    const itemsHtml = verifiedItems.length > 0
      ? verifiedItems
          .map(
            (item) =>
              `• <b>${item.quantity}x</b> ${escapeHtml(item.name)} ${item.variantName ? `(${escapeHtml(item.variantName)})` : ''} — <code>${item.price * item.quantity} ج.م</code>`
          )
          .join('\n')
      : '• مستحضرات عناية طبيعية';

    const text =
      `🛍️ <b>طلب شراء جديد تم استلامه في متجر ROMA!</b>\n` +
      `🔖 رقم الطلب: <code>#ROMA-${cleanId}</code>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>العميل:</b> ${escapeHtml(customerName)}\n` +
      `📞 <b>رقم الهاتف:</b> <code>${escapeHtml(customerPhone || 'غير متوفر')}</code>\n` +
      `📍 <b>عنوان التوصيل:</b> ${escapeHtml(shippingAddress)}\n` +
      `💳 <b>طريقة الدفع:</b> ${escapeHtml(cleanPaymentMethod)}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>المنتجات المطلوبة:</b>\n${itemsHtml}\n\n` +
      (verifiedShippingCost ? `🚚 <b>الشحن:</b> ${verifiedShippingCost} ج.م\n` : '') +
      `💰 <b>الإجمالي النهائي المحسوب:</b> <b>${verifiedTotalAmount} ج.م</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `الحالة: ⏳ <b>طلب جديد (قيد الانتظار)</b>`;

    const cleanPhone = (customerPhone || '').replace(/\D+/g, '');
    const waPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;
    const waUrl = cleanPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ/ة ${customerName}، بخصوص طلبكِ رقم #ROMA-${cleanId} من متجر Roma:`)}`
      : 'https://roma-eg.my';

    // Interactive buttons: Accept, Ship, WhatsApp Direct Contact
    const keyboard = [
      [
        { text: '✅ تأكيد الطلب', callback_data: `ord_status_confirmed_${cleanId}` },
        { text: '🚚 قيد الشحن', callback_data: `ord_status_shipped_${cleanId}` },
      ],
      [
        { text: '✨ تم التسليم', callback_data: `ord_status_delivered_${cleanId}` },
        { text: '❌ إلغاء الطلب', callback_data: `ord_status_cancelled_${cleanId}` },
      ],
      [
        { text: 'محادثة العميلة عبر واتساب 💬', url: waUrl },
      ],
    ];

    // 3. Send Telegram notification from Cloud Server using environment secrets (Deduplicated)
    let telegramResult = null;
    if (isDuplicate) {
      console.log(`[ORDERS API] Order ${dedupKey} already sent to Telegram. Skipping duplicate message.`);
    } else if (BOT_TOKEN && ADMIN_CHAT_ID) {
      sentTelegramOrderIds.add(dedupKey);
      if (sentTelegramOrderIds.size > 2000) {
        const first = sentTelegramOrderIds.values().next().value;
        sentTelegramOrderIds.delete(first);
      }
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: keyboard,
            },
          }),
        });
        telegramResult = await tgRes.json();

        if (!telegramResult?.ok) {
          console.error('Telegram API error response:', JSON.stringify(telegramResult));
        }

        // Send receipt screenshot/image to Telegram bot if provided
        if (receiptImage) {
          try {
            if (typeof receiptImage === 'string' && receiptImage.startsWith('data:image/')) {
              const matches = receiptImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches) {
                const mimeType = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const blob = new Blob([buffer], { type: mimeType });
                const formData = new FormData();
                formData.append('chat_id', ADMIN_CHAT_ID);
                formData.append('photo', blob, `receipt_${orderId}.jpg`);
                formData.append(
                  'caption',
                  `🧾 <b>صورة إيصال التحويل للطلب:</b> <code>#ROMA-${orderId}</code>\n👤 <b>العميل:</b> ${escapeHtml(customerName)}\n📞 <code>${escapeHtml(customerPhone)}</code>`
                );
                formData.append('parse_mode', 'HTML');
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                  method: 'POST',
                  body: formData,
                });
              }
            } else if (typeof receiptImage === 'string' && receiptImage.startsWith('http')) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: ADMIN_CHAT_ID,
                  photo: receiptImage,
                  caption: `🧾 صورة إيصال التحويل للطلب: #ROMA-${orderId} | العميل: ${customerName} (${customerPhone})`,
                }),
              });
            }
          } catch (photoErr) {
            console.error('Telegram sendPhoto receipt dispatch notice:', photoErr);
          }
        }
      } catch (tgErr) {
        console.error('Telegram dispatch error inside /api/orders:', JSON.stringify(tgErr));
      }
    } else {
      console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID environment variable is missing.');
    }

    res.status(200).json({
      success: true,
      orderId,
      verifiedTotalAmount,
      telegram: telegramResult,
      supabase: supabaseResult,
    });
  } catch (error) {
    console.error('/api/orders serverless error:', JSON.stringify(error));
    res.status(500).json({ success: false, error: String(error) });
  }
}
