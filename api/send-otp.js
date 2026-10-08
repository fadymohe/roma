import { sendWhatsAppText } from '../lib/whatsapp-bridge.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export default async function handler(req, res) {
  // Allow POST only
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
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

    // Mask phone for privacy in logs and responses (e.g. 010****5678)
    const maskedPhone = `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(7)}`;

    // Build professional Arabic WhatsApp verification message
    const message = `🌸 *متجر روما | ROMA Beauty*\n\nمرحباً بكِ ${name ? `*${name.trim()}*` : ''} ✨\nرمز التحقق الخاص بكِ لتأكيد رقم الهاتف وإنشاء الحساب هو:\n\n🔑 *${otp}*\n\n⏱️ هذا الرمز صالح لمدة 5 دقائق.\n⚠️ يرجى عدم مشاركة هذا الرمز مع أي شخص للحفاظ على خصوصية وأمان حسابكِ.`;

    let waResult = null;
    try {
      waResult = await sendWhatsAppText(cleanPhone, message);
    } catch (waErr) {
      console.warn('[SEND-OTP] WhatsApp dispatch note:', waErr?.message);
    }

    // Optional Telegram notification to admin so admin can assist customer if needed
    if (BOT_TOKEN && ADMIN_CHAT_ID) {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text: `🔐 <b>رمز تحقق OTP لتسجيل حساب:</b>\n👤 <b>الاسم:</b> ${name || 'عميلة جديدة'}\n📞 <code>${maskedPhone}</code>\n🔢 <b>الكود:</b> <code>${otp}</code>`,
            parse_mode: 'HTML',
          }),
        });
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      maskedPhone,
      whatsapp: waResult?.success ?? false,
    });
  } catch (error) {
    console.error('[SEND-OTP] Handler error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Server error' });
  }
}
