import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_FOLDER = path.join(__dirname, '..', '.whatsapp-auth');
const QR_IMAGE_PATH = path.join(__dirname, '..', 'whatsapp-qr.png');
const QR_HTML_PATH = path.join(__dirname, '..', 'whatsapp-qr.html');
const ARTIFACT_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\35e011cb-f810-4953-9609-14c7bf36bd75';
const ARTIFACT_QR_PATH = path.join(ARTIFACT_DIR, 'whatsapp-qr.png');

if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

export const MERCHANT_PHONE = '201150583501';
let waSock = null;
let isConnecting = false;
let isConnected = false;

// Format Egyptian phone numbers to WhatsApp international format (e.g., 2010XXXXXXXX)
export function formatToWhatsAppJid(phone = '') {
  if (!phone) return null;
  let clean = String(phone).replace(/\D+/g, '');
  if (!clean) return null;

  if (clean.startsWith('0')) {
    clean = '2' + clean; // 010... -> 2010...
  } else if (!clean.startsWith('20') && clean.length === 10) {
    clean = '20' + clean;
  }

  if (clean.length < 10) return null;
  return `${clean}@s.whatsapp.net`;
}

// Telegram photo notifier helper (to send QR code photo to merchant on Telegram)
async function sendTelegramQRPhoto(imageBuffer) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN || '8358497211:AAGFxuBElCIFNorRaqJek09AWR6ed52B8CM';
    const admin = process.env.TELEGRAM_ADMIN_CHAT_ID || '8940310160';
    if (!token || !admin) return;

    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('chat_id', admin);
    formData.append('photo', blob, 'whatsapp-qr.png');
    formData.append(
      'caption',
      '📷 *باركود ربط واتساب (QR Code)*\n\n' +
      '1. افتح واتساب (أو واتساب الأعمال) على هاتفك.\n' +
      '2. الإعدادات > الأجهزة المرتبطة > ربط جهاز.\n' +
      '3. وجّه كاميرا الهاتف نحو الباركود لمسحه.\n\n' +
      '⚡ سيتم الربط فوراً لبدء إرسال رسائل تأكيد الطلبات وتحديثات الشحن والسلات المتروكة تلقائياً.'
    );
    formData.append('parse_mode', 'Markdown');

    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.warn('Could not send QR photo to Telegram:', err?.message);
  }
}

/**
 * Initialize and start WhatsApp socket with QR Code support
 */
export async function initWhatsApp() {
  if (isConnecting || isConnected) return waSock;
  isConnecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    waSock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: true, // Print ASCII QR code in terminal for quick scan
      browser: ['Roma Store Automated Concierge', 'Chrome', '124.0.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    waSock.ev.on('creds.update', saveCreds);

    waSock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Handle QR Code Generation
      if (qr) {
        console.log('\n============================================================');
        console.log('📷 تم توليد باركود ربط واتساب الجديد (QR Code)!');
        console.log('امسح الباركود المعروض في الشاشة أو عبر الصفحة المفتوحة.');
        console.log('============================================================\n');

        try {
          // 1. Generate PNG image
          const pngBuffer = await QRCode.toBuffer(qr, {
            scale: 10,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          fs.writeFileSync(QR_IMAGE_PATH, pngBuffer);

          // 2. Save copy to artifacts directory for in-chat rendering
          if (fs.existsSync(ARTIFACT_DIR)) {
            fs.writeFileSync(ARTIFACT_QR_PATH, pngBuffer);
          }

          // 3. Generate HTML page with auto-refresh
          const base64Png = pngBuffer.toString('base64');
          const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>ربط واتساب متجر ROMA</title>
  <style>
    body {
      background: #0A0A0A;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #141414;
      border: 1px solid rgba(212, 165, 165, 0.3);
      border-radius: 24px;
      padding: 32px;
      max-width: 440px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    }
    h1 {
      color: #D4A5A5;
      font-size: 22px;
      margin-bottom: 8px;
    }
    p {
      color: #A1A1AA;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .qr-container {
      background: #FFFFFF;
      padding: 16px;
      border-radius: 20px;
      display: inline-block;
      box-shadow: 0 8px 30px rgba(212, 165, 165, 0.2);
    }
    img {
      width: 280px;
      height: 280px;
      display: block;
    }
    .steps {
      text-align: right;
      background: #1E1E1E;
      border-radius: 16px;
      padding: 16px 20px;
      margin-top: 24px;
      font-size: 13px;
      color: #E4E4E7;
      line-height: 1.8;
    }
    .badge {
      display: inline-block;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ADE80;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">جاهز للمسح الآن 🟢</div>
    <h1>باركود ربط واتساب متجر ROMA</h1>
    <p>امسحي الباركود من تطبيق واتساب على هاتفك لتفعيل إرسال رسائل تأكيد الطلبات وتحديثات الشحن تلقائياً.</p>
    
    <div class="qr-container">
      <img src="data:image/png;base64,${base64Png}" alt="WhatsApp QR Code" />
    </div>

    <div class="steps">
      <b>📌 خطوات الربط:</b><br/>
      1. افتحي واتساب على هاتفك.<br/>
      2. الإعدادات ⚙️ > الأجهزة المرتبطة (Linked Devices).<br/>
      3. اضغطي (ربط جهاز) ووجّهي الكاميرا نحو هذا الباركود.
    </div>
  </div>
</body>
</html>`;
          fs.writeFileSync(QR_HTML_PATH, htmlContent, 'utf8');

          // 4. Automatically open HTML page on user's screen
          exec(`start "" "${QR_HTML_PATH}"`, () => {});

          // 5. Send directly to Telegram admin chat
          await sendTelegramQRPhoto(pngBuffer);
        } catch (qrErr) {
          console.error('Error generating QR image:', qrErr);
        }
      }

      if (connection === 'close') {
        isConnected = false;
        isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`⚠️ WhatsApp connection closed (Reason: ${statusCode}). Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => initWhatsApp(), 3000);
        } else {
          console.log('❌ Session reset. Generating fresh QR code...');
          try {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          } catch (_) {}
          setTimeout(() => initWhatsApp(), 2000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        isConnecting = false;
        console.log(`\n🟢 [WHATSAPP] تم الاتصال بنجاح وتفعيل الربط لرقمك: +${MERCHANT_PHONE}!`);

        // Notify merchant on Telegram
        const token = process.env.TELEGRAM_BOT_TOKEN || '8358497211:AAGFxuBElCIFNorRaqJek09AWR6ed52B8CM';
        const admin = process.env.TELEGRAM_ADMIN_CHAT_ID || '8940310160';
        if (token && admin) {
          fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: admin,
              text: '🟢 *تم مسح الباركود وربط واتساب بنجاح!* 🎉\n\nنظام روما متصل الآن بحساب واتساب الخاص بك، وسيتم إرسال رسائل تأكيد الطلبات وتحديثات الشحن والسلات المتروكة تلقائياً.',
              parse_mode: 'Markdown',
            }),
          }).catch(() => {});
        }
      }
    });

    return waSock;
  } catch (err) {
    isConnecting = false;
    isConnected = false;
    console.error('WhatsApp init error:', err);
    return null;
  }
}

/**
 * Send raw text message via WhatsApp
 */
export async function sendWhatsAppText(phoneNumber, text) {
  try {
    const jid = formatToWhatsAppJid(phoneNumber);
    if (!jid) {
      console.warn(`[WHATSAPP] Invalid customer phone: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone format' };
    }

    if (!isConnected) {
      if (!isConnecting) {
        initWhatsApp().catch(() => {});
      }
      // Wait up to 5 seconds if connecting
      for (let i = 0; i < 10; i++) {
        if (isConnected && waSock) break;
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (!waSock || !isConnected) {
      console.warn(`[WHATSAPP] WhatsApp not connected yet. Cannot send to ${phoneNumber}`);
      return { success: false, error: 'WhatsApp not connected' };
    }

    const res = await waSock.sendMessage(jid, { text });
    console.log(`[WHATSAPP] Message sent successfully to ${phoneNumber} (${jid})`);
    return { success: true, messageId: res?.key?.id };
  } catch (err) {
    console.error(`[WHATSAPP] Send error to ${phoneNumber}:`, err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * 1. Automatic Order Confirmation WhatsApp Message
 */
export async function sendOrderConfirmationWhatsApp(order) {
  const customerName = order.customerName || order.customer_name || 'عميلتنا العزيزة';
  const customerPhone = order.customerPhone || order.phone;
  const orderNum = order.orderNumber || order.order_number || order.orderId || order.id;
  const totalAmount = order.totalAmount || order.total_amount || 0;
  const address = order.shippingAddress || order.shipping_address || 'عنوانك المسجل';

  let itemsSummary = '';
  if (Array.isArray(order.items)) {
    itemsSummary = order.items
      .map((it) => `• *${it.quantity || 1}x* ${it.name || it.product_name} ${it.variantName || it.variant ? `(${it.variantName || it.variant})` : ''} — ${(it.price || 0) * (it.quantity || 1)} ج.م`)
      .join('\n');
  }

  const message =
    `🌸 *مرحباً أستاذ/ة ${customerName}*\n\n` +
    `تم تأكيد طلبكِ رقم \`#ROMA-${orderNum}\` من متجر *ROMA Beauty* بنجاح! ✨\n\n` +
    `📦 *المنتجات المطلوبة:*\n` +
    `${itemsSummary || '• مستحضرات عناية طبيعية فاخرة'}\n\n` +
    `📍 *عنوان التوصيل:* ${address}\n` +
    `💰 *الإجمالي المطلوب:* *${totalAmount} ج.م*\n` +
    `⏳ *الحالة:* ✅ *تم التأكيد وجاري تجهيز الشحنة والتغليف الفاخر.*\n\n` +
    `سيتم إشعاركِ فور خروج الشحنة مع مندوب شركة الشحن.\n` +
    `شكراً لاختياركِ متجر روما للعناية والجمال الطبيعي 🌿`;

  return await sendWhatsAppText(customerPhone, message);
}

/**
 * 2. Automatic Shipping Status Update WhatsApp Message
 */
export async function sendShippingUpdateWhatsApp(order, newStatus, trackingInfo = {}) {
  const customerName = order.customerName || order.customer_name || 'عميلتنا العزيزة';
  const customerPhone = order.customerPhone || order.phone;
  const orderNum = order.orderNumber || order.order_number || order.orderId || order.id;

  let statusTitle = '';
  let statusEmoji = '🚚';
  let statusDesc = '';

  if (newStatus === 'shipped') {
    statusEmoji = '🚚';
    statusTitle = 'الشحنة خرجت للتوصيل';
    statusDesc = 'طلبكِ الآن في الطريق إليكِ مع مندوب شركة الشحن، يرجى التواجد واستلام الشحنة عند اتصال المندوب.';
  } else if (newStatus === 'delivered') {
    statusEmoji = '✨';
    statusTitle = 'تم تسليم الطلب بنجاح';
    statusDesc = 'سعدنا بخدمتكِ جداً! نأمل أن تنال منتجات روما الطبيعية إعجابكِ، ونتطلع لتكرار تجربتكِ قريباً.';
  } else if (newStatus === 'cancelled') {
    statusEmoji = '❌';
    statusTitle = 'تم إلغاء الطلب';
    statusDesc = 'تم إلغاء الطلب. إذا كان لديكِ أي استفسار يسعدنا دائماً خدمتكِ والرد عليكِ.';
  } else {
    statusTitle = `تحديث حالة الطلب: ${newStatus}`;
    statusDesc = 'تم تحديث حالة طلبكِ.';
  }

  const trackingText = trackingInfo.trackingNumber
    ? `\n🔖 *رقم بوليصة الشحن:* \`${trackingInfo.trackingNumber}\`\n🏷️ *شركة الشحن:* ${trackingInfo.carrier || 'الشحن السريع'}\n` +
      (trackingInfo.trackingUrl ? `🔗 *تتبع شحنتك:* ${trackingInfo.trackingUrl}\n` : '')
    : '';

  const message =
    `${statusEmoji} *أهلاً بكِ مجدداً أستاذ/ة ${customerName}*\n\n` +
    `إشعار بخصوص طلبكِ رقم \`#ROMA-${orderNum}\`:\n` +
    `📌 *الحالة الحالية:* *${statusTitle}*\n` +
    `${statusDesc}\n` +
    `${trackingText}\n` +
    `نسعد دائماً بخدمتكِ في *ROMA Beauty* 🌿`;

  return await sendWhatsAppText(customerPhone, message);
}

/**
 * 3. Automatic 5-Minute Abandoned Cart Recovery Message
 */
export async function sendAbandonedCartWhatsApp(cart) {
  const customerName = cart.customerName || cart.customer_name || 'جميلتنا';
  const customerPhone = cart.customerPhone || cart.phone;
  const couponCode = 'ROMA10';
  const recoveryUrl = cart.recoveryUrl || `https://roma-eg.my/cart?recovery_id=${cart.id || ''}&coupon=${couponCode}`;

  let itemsText = '';
  if (Array.isArray(cart.items) && cart.items.length > 0) {
    itemsText = cart.items.map((it) => `• ${it.nameAr || it.name || 'مستحضر فاخر'}`).slice(0, 3).join('\n');
  }

  const message =
    `🌿 *مرحباً بكِ في ROMA Beauty*\n\n` +
    `أهلاً أستاذ/ة ${customerName}، لاحظنا أنكِ تركتِ بعض المستحضرات المميزة في حقيبة تسوقكِ:\n` +
    `${itemsText ? itemsText + '\n\n' : ''}` +
    `🎁 *هدية خاصة لكِ:* نهديكِ كود الخصم الحصري \`${couponCode}\` للحصول على *خصم 10% فوري* عند إتمام الطلب الآن!\n\n` +
    `🛒 *اضغطي هنا لإكمال طلبكِ واستلام هديتكِ:*\n${recoveryUrl}\n\n` +
    `المخزون محدود لبعض القطع، نتمنى لكِ يوماً مشرقاً! ✨`;

  return await sendWhatsAppText(customerPhone, message);
}
