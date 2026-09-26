const BOT_TOKEN = '8358497211:AAF5Tr2e3VHXSt5K1BEvxqa-8bgIaHj-nwA';
const ADMIN_CHAT_ID = '8940310160';
const SUPABASE_URL = 'https://dsgrgbmvbvqwzizbbwxf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3JnYm12YnZxd3ppemJid3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODE0MTMsImV4cCI6MjEwNTk1NzQxM30.kd8bIzK5UzbWIPP4eCHhkflhaRLQ7C1AKb-RhDnvbhM';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      orderId = Math.floor(100000 + Math.random() * 900000),
      customerName = 'عميل المتجر',
      customerPhone = '',
      shippingAddress = '',
      paymentMethod = 'الدفع عند الاستلام',
      items = [],
      shippingCost = 0,
      totalAmount = 0,
      userId = null,
    } = body;

    // 1. Try saving to Supabase
    let supabaseResult = null;
    try {
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          status: 'pending',
          total_amount: totalAmount,
          customer_name: customerName,
          phone: customerPhone,
          shipping_address: shippingAddress,
          items: items,
        }),
      });
      if (sbRes.ok) {
        supabaseResult = await sbRes.json();
      }
    } catch (sbErr) {
      console.warn('Supabase insert inside /api/orders notice:', sbErr);
    }

    // 2. Format HTML Notification for Telegram
    const itemsHtml = Array.isArray(items)
      ? items
          .map(
            (item) =>
              `• <b>${item.quantity || 1}x</b> ${escapeHtml(item.name || 'مستحضر')} ${item.variantName ? `(${escapeHtml(item.variantName)})` : ''} — <code>${(item.price || 0) * (item.quantity || 1)} ج.م</code>`
          )
          .join('\n')
      : '• مستحضرات عناية طبيعية';

    const text =
      `🛍️ <b>طلب شراء جديد تم استلامه في متجر ROMA!</b>\n` +
      `🔖 رقم الطلب: <code>#ROMA-${orderId}</code>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>العميل:</b> ${escapeHtml(customerName)}\n` +
      `📞 <b>رقم الهاتف:</b> <code>${escapeHtml(customerPhone || 'غير متوفر')}</code>\n` +
      `📍 <b>عنوان التوصيل:</b> ${escapeHtml(shippingAddress)}\n` +
      `💳 <b>طريقة الدفع:</b> ${escapeHtml(paymentMethod)}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>المنتجات المطلوبة:</b>\n${itemsHtml}\n\n` +
      (shippingCost ? `🚚 <b>الشحن:</b> ${shippingCost} ج.م\n` : '') +
      `💰 <b>الإجمالي النهائي:</b> <b>${totalAmount} ج.م</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `الحالة: ⏳ <b>طلب جديد (قيد الانتظار)</b>`;

    const cleanPhone = (customerPhone || '').replace(/\D+/g, '');
    const waPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;
    const waUrl = cleanPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ/ة ${customerName}، بخصوص طلبكِ رقم #ROMA-${orderId} من متجر Roma:`)}`
      : 'https://roma-eg.my';

    const inlineKeyboard = [
      [
        { text: 'تجهيز الطلب 🛠️', callback_data: `ord_status_processing_${orderId}` },
        { text: 'تم الشحن 🚚', callback_data: `ord_status_shipped_${orderId}` },
      ],
      [
        { text: 'تم التسليم ✅', callback_data: `ord_status_completed_${orderId}` },
        { text: 'إلغاء الطلب ❌', callback_data: `ord_status_cancelled_${orderId}` },
      ],
    ];

    if (cleanPhone) {
      inlineKeyboard.push([{ text: 'محادثة واتساب مباشرة 💬', url: waUrl }]);
    }

    // 3. Send Telegram notification from Vercel Cloud Server
    let telegramResult = null;
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
        }),
      });
      telegramResult = await tgRes.json();
    } catch (tgErr) {
      console.error('Telegram dispatch error inside /api/orders:', tgErr);
    }

    res.status(200).json({
      success: true,
      orderId,
      telegram: telegramResult,
      supabase: supabaseResult,
    });
  } catch (error) {
    console.error('/api/orders serverless error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
}
