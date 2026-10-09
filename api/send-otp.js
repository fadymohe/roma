import { sendWhatsAppText } from '../lib/whatsapp-bridge.js';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dsgrgbmvbvqwzizbbwxf.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3JnYm12YnZxd3ppemJid3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODE0MTMsImV4cCI6MjEwNTk1NzQxM30.kd8bIzK5UzbWIPP4eCHhkflhaRLQ7C1AKb-RhDnvbhM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Rate limiting in-memory store
const ipRateLimits = new Map();
const phoneRateLimits = new Map();

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ipRateLimits) if (now > v.resetAt) ipRateLimits.delete(k);
  for (const [k, v] of phoneRateLimits) if (now > v.resetAt) phoneRateLimits.delete(k);
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

function checkRateLimit(map, key, maxAllowed, windowMs) {
  const now = Date.now();
  const entry = map.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
  } else {
    entry.count += 1;
  }
  map.set(key, entry);
  return entry.count <= maxAllowed;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Allow POST only
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const clientIp = getTrustedClientIp(req);

  // Rate Limit: 10 requests per IP per 10 minutes
  if (!checkRateLimit(ipRateLimits, clientIp, 10, 10 * 60 * 1000)) {
    return res.status(429).json({
      success: false,
      error: 'تم تجاوز عدد محاولات إرسال رمز التحقق لهذا الجهاز. يرجى الانتظار قليلاً.',
    });
  }

  try {
    const { phone, otp, name } = req.body || {};

    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Phone and OTP code are required' });
    }

    const cleanPhone = String(phone).replace(/\D+/g, '');
    if (cleanPhone.length !== 11 || !/^(010|011|012|015)/.test(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Invalid Egyptian phone format' });
    }

    // Rate Limit: Max 5 OTP dispatches per phone number per 15 minutes
    if (!checkRateLimit(phoneRateLimits, cleanPhone, 5, 15 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'تم إرسال عدة رموز لهذا الرقم مؤخراً. يرجى الانتظار قبل المحاولة مرة أخرى.',
      });
    }

    // Sanitize OTP: Must be exactly 6 digits
    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, error: 'Invalid OTP format (must be 6 digits)' });
    }

    // Mask phone for privacy in logs
    const maskedPhone = `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(7)}`;
    const sanitizedName = String(name || '').replace(/[^\p{L}\s]/gu, '').slice(0, 40).trim();

    // Professional Arabic WhatsApp verification message
    const message = `🌸 *متجر روما | ROMA Beauty*\n\nمرحباً بكِ ${sanitizedName ? `*${sanitizedName}*` : ''} ✨\nرمز التحقق الخاص بكِ لتأكيد رقم الهاتف وإنشاء الحساب هو:\n\n🔑 *${cleanOtp}*\n\n⏱️ هذا الرمز صالح لمدة 5 دقائق.\n⚠️ يرجى عدم مشاركة هذا الرمز مع أي شخص للحفاظ على خصوصية وأمان حسابكِ.`;

    let waResult = null;
    try {
      waResult = await sendWhatsAppText(cleanPhone, message);
    } catch (waErr) {
      console.warn('[SEND-OTP] Direct WhatsApp dispatch note:', waErr?.message);
    }

    // Queue in Supabase so the background bot service picks it up via Baileys if running remotely
    try {
      await supabase.from('orders').insert({
        order_number: `OTP-${Date.now()}-${cleanOtp}`,
        status: 'otp_pending',
        phone: cleanPhone,
        customer_name: sanitizedName || 'عميلة روما',
        items: [{ otp: cleanOtp, message }],
        total_amount: 0,
        shipping_address: 'تحقق من الهاتف',
        payment_method: 'واتساب OTP',
        created_at: new Date().toISOString(),
      });
    } catch (queueErr) {
      console.warn('[SEND-OTP] Supabase queue error:', queueErr?.message);
    }

    // Instant Telegram notification to admin
    if (BOT_TOKEN && ADMIN_CHAT_ID) {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text: `🔐 <b>رمز تحقق OTP لتسجيل حساب:</b>\n👤 <b>الاسم:</b> ${sanitizedName || 'عميلة جديدة'}\n📞 <code>${maskedPhone}</code>\n🔢 <b>الكود:</b> <code>${cleanOtp}</code>`,
            parse_mode: 'HTML',
          }),
        });
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      maskedPhone,
      whatsapp: waResult?.success ?? true,
    });
  } catch (error) {
    console.error('[SEND-OTP] Internal error:', error?.message);
    return res.status(500).json({ success: false, error: 'فشل إرسال الرمز. يرجى المحاولة لاحقاً.' });
  }
}
