import 'dotenv/config';
import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { scrapeAmazonProduct, downloadAmazonImages } from './amazon-scraper.js';
import {
  initWhatsApp,
  sendOrderConfirmationWhatsApp,
  sendShippingUpdateWhatsApp,
  sendAbandonedCartWhatsApp,
  MERCHANT_PHONE,
} from './lib/whatsapp-bridge.js';
import { getAuthenticatedSupabase } from './lib/supabase-server.js';

// Prevent process crashing from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception in Bot:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection in Bot:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure single instance to prevent Telegram 409 Conflict
const PID_FILE = path.join(__dirname, '.bot.pid');
try {
  if (fs.existsSync(PID_FILE)) {
    const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10);
    if (!isNaN(oldPid) && oldPid !== process.pid) {
      try {
        process.kill(oldPid, 0);
        console.log(`[BOT] Stopping previous instance (PID: ${oldPid})...`);
        process.kill(oldPid, 'SIGKILL');
      } catch (_) {}
    }
  }
  fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
} catch (_) {}

process.on('exit', () => {
  try {
    if (fs.existsSync(PID_FILE)) {
      const p = parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10);
      if (p === process.pid) fs.unlinkSync(PID_FILE);
    }
  } catch (_) {}
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8358497211:AAGFxuBElCIFNorRaqJek09AWR6ed52B8CM';
const ADMIN_CHAT_ID = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '8940310160');
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dsgrgbmvbvqwzizbbwxf.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3JnYm12YnZxd3ppemJid3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODE0MTMsImV4cCI6MjEwNTk1NzQxM30.kd8bIzK5UzbWIPP4eCHhkflhaRLQ7C1AKb-RhDnvbhM';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PRODUCTS_JSON_PATH = path.join(__dirname, 'artifacts', 'roma-store', 'public', 'products.json');
const DIST_PRODUCTS_JSON_PATH = path.join(__dirname, 'dist', 'products.json');
const UPLOADS_DIR = path.join(__dirname, 'artifacts', 'roma-store', 'public', 'uploads');
const DIST_UPLOADS_DIR = path.join(__dirname, 'dist', 'uploads');
const ORDERS_JSON_PATH = path.join(__dirname, 'orders.json');
const ROOT_SYNC_PATH = path.join(__dirname, 'products-sync.json');

// Ensure directories exist
for (const dir of [UPLOADS_DIR, DIST_UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// In-memory sessions for multi-step wizards
const sessions = new Map();
const adminProductSearches = new Map(); // chatId -> query string

// Helper to call Telegram API via native fetch with automatic retry
async function tg(method, body = {}, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!data.ok && attempt <= retries && res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return data;
    } catch (err) {
      if (attempt <= retries) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.error(`Telegram API error on ${method}:`, err.message);
      return { ok: false, error: err.message };
    }
  }
}

// ----------------- Data Storage Helpers -----------------

function getProducts() {
  try {
    if (fs.existsSync(PRODUCTS_JSON_PATH)) {
      return JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading products:', e);
  }
  return [];
}

function getOrders() {
  try {
    if (fs.existsSync(ORDERS_JSON_PATH)) {
      return JSON.parse(fs.readFileSync(ORDERS_JSON_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading orders:', e);
  }
  return [];
}

async function getAllOrdersCombined() {
  const local = getOrders();
  try {
    const sbClient = await getAuthenticatedSupabase();
    const { data, error } = await sbClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const sbOrders = data.map((row) => ({
        orderId: row.id,
        orderNumber: row.order_number,
        customerName: row.shipping_details?.fullName || row.customer_name || 'عميلة المتجر',
        customerPhone: row.phone || row.shipping_details?.phone || 'غير مسجل',
        shippingAddress: row.shipping_details?.fullAddress || row.shipping_address || 'غير محدد',
        totalAmount: row.total_amount,
        status: row.status || 'pending',
        paymentMethod: row.payment_method,
        items: Array.isArray(row.items) ? row.items : [],
        createdAt: row.created_at,
      }));

      // Combine and deduplicate
      const combined = [...sbOrders];
      local.forEach((loc) => {
        if (!combined.some((c) => String(c.orderId) === String(loc.orderId))) {
          combined.push(loc);
        }
      });
      return combined;
    }
  } catch (err) {
    console.warn('Supabase fetch orders in bot notice:', err?.message);
  }
  return local;
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_JSON_PATH, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving orders:', e);
  }
}

function saveProducts(products, actionDesc = 'Update products') {
  try {
    const data = JSON.stringify(products, null, 2);
    fs.writeFileSync(PRODUCTS_JSON_PATH, data, 'utf8');

    if (fs.existsSync(path.dirname(DIST_PRODUCTS_JSON_PATH))) {
      fs.writeFileSync(DIST_PRODUCTS_JSON_PATH, data, 'utf8');
    }

    const syncInfo = {
      lastSync: new Date().toISOString(),
      totalProducts: products.length,
      lastAction: actionDesc,
    };
    fs.writeFileSync(ROOT_SYNC_PATH, JSON.stringify(syncInfo, null, 2), 'utf8');

    updateCatalogData(products);
    autoPush(actionDesc);
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

function updateCatalogData(products) {
  try {
    const catalogPath = path.join(__dirname, 'artifacts', 'roma-store', 'src', 'lib', 'catalog-data.ts');
    if (fs.existsSync(catalogPath)) {
      let content = fs.readFileSync(catalogPath, 'utf8');
      const jsonStr = JSON.stringify(products, null, 2);
      content = content.replace(/export const PRODUCTS: Product\[\] = \[[\s\S]*?\];/, `export const PRODUCTS: Product[] = ${jsonStr};`);
      fs.writeFileSync(catalogPath, content, 'utf8');
    }
  } catch (e) {
    console.error('Error updating catalog-data.ts:', e);
  }
}

function autoPush(actionDesc) {
  exec(
    `git add . && git commit -m "${actionDesc} via Telegram Bot" && git push origin main`,
    { cwd: __dirname },
    (err) => {
      if (err) {
        console.error('Git push notice:', err.message);
      } else {
        console.log('🚀 Pushed changes to GitHub for instant live deployment!');
      }
    }
  );
}

// Download file from Telegram to local uploads dir
async function downloadTelegramPhoto(fileId) {
  try {
    const fileRes = await tg('getFile', { file_id: fileId });
    if (!fileRes.ok || !fileRes.result?.file_path) return null;

    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.result.file_path}`;
    const ext = path.extname(fileRes.result.file_path) || '.jpg';
    const fileName = `prod_${Date.now()}${ext}`;
    const localPath = path.join(UPLOADS_DIR, fileName);

    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(localPath, buffer);

    const distPath = path.join(DIST_UPLOADS_DIR, fileName);
    try {
      fs.writeFileSync(distPath, buffer);
    } catch (_) {}

    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('Download photo error:', err);
    return null;
  }
}

// Main Dashboard Keyboards
function getMainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📦 سحب منتج من أمازون 🛒', callback_data: 'nav_amazon_prod' },
        { text: '➕ إضافة منتج يدوي', callback_data: 'nav_add_prod' },
      ],
      [
        { text: '🏷️ إدارة المنتجات والمخزون', callback_data: 'nav_list_prod' },
        { text: '🔍 بحث في المنتجات', callback_data: 'nav_search_prod' },
      ],
      [
        { text: '📦 متابعة الطلبات', callback_data: 'nav_orders_all' },
        { text: '🛒 السلات المتروكة', callback_data: 'nav_check_abandoned' },
      ],
      [
        { text: '📊 تقرير الإيرادات والمبيعات', callback_data: 'nav_stats' },
        { text: '🌐 زيارة متجر Roma', url: 'https://roma-eg.my' },
      ],
    ],
  };
}

function getCategoryKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🎀 إكسسوارات الشعر', callback_data: 'cat_إكسسوارات الشعر' },
        { text: '👜 إكسسوارات الإطلالة', callback_data: 'cat_إكسسوارات الإطلالة' },
      ],
      [
        { text: '💎 مجوهرات اليد والعنق', callback_data: 'cat_مجوهرات اليد والعنق' },
        { text: '💄 المكياج والجمال', callback_data: 'cat_المكياج والجمال' },
      ],
      [
        { text: '🌸 العناية بالجسم والنعومة', callback_data: 'cat_العناية بالجسم والنعومة' },
        { text: '👑 العطور الفاخرة', callback_data: 'cat_العطور الفاخرة' },
      ],
    ],
  };
}

// Status labels & badges
const STATUS_MAP = {
  pending: { label: 'قيد الانتظار ⏳', badge: '⏳ جديد' },
  confirmed: { label: 'تم التأكيد بنجاح ✅', badge: '✅ مؤكد' },
  processing: { label: 'جاري التجهيز 🛠️', badge: '🛠️ بالتجهيز' },
  shipped: { label: 'تم الشحن مع المندوب 🚚', badge: '🚚 مشحون' },
  delivered: { label: 'تم التسليم بنجاح ✨', badge: '✨ تم التسليم' },
  completed: { label: 'تم التسليم بنجاح ✨', badge: '✨ مكتمل' },
  cancelled: { label: 'تم الإلغاء ❌', badge: '❌ ملغي' },
};

const ADMINS_FILE = path.join(__dirname, 'admins.json');

function getKnownAdmins() {
  const set = new Set([ADMIN_CHAT_ID]);
  try {
    if (fs.existsSync(ADMINS_FILE)) {
      const arr = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
      arr.forEach((id) => set.add(String(id)));
    }
  } catch (_) {}
  return Array.from(set);
}

function registerAdmin(chatId) {
  if (!chatId) return;
  const current = getKnownAdmins();
  if (!current.includes(String(chatId))) {
    current.push(String(chatId));
    try {
      fs.writeFileSync(ADMINS_FILE, JSON.stringify(current, null, 2), 'utf8');
      console.log(`[BOT] Registered new admin chat ID: ${chatId}`);
    } catch (_) {}
  }
}

// ----------------- Realtime Notification Dispatcher -----------------

async function sendNewOrderNotification(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText =
    items
      .map(
        (it) =>
          `• *${it.quantity || 1}x* ${it.name || it.product_name} ${it.variant ? `(${it.variant})` : ''} — \`${(Number(it.price) || 0) * (Number(it.quantity) || 1)} ج.م\``
      )
      .join('\n') || 'لا توجد تفاصيل منتجات';

  const shipping = order.shipping_details || {};
  const customerName = order.customer_name || shipping.fullName || 'عميلة المتجر';
  const customerPhone = order.phone || shipping.phone || 'غير مسجل';
  const city = shipping.city || 'القاهرة';
  const address = order.shipping_address || shipping.fullAddress || 'غير محدد';
  const paymentMethod = order.payment_method || 'إنستاباي / محفظة إلكترونية';
  const paymentRef = order.payment_reference || '';
  const total = Number(order.total_amount) || 0;
  const orderId = order.id || order.order_number;

  const caption =
    `🛍️ *طلب شراء جديد تم استلامه في متجر ROMA!*\n` +
    `🔖 *رقم الطلب:* \`#ROMA-${order.order_number || orderId}\`\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 *العميلة:* ${customerName}\n` +
    `📞 *رقم الهاتف:* \`${customerPhone}\`\n` +
    `📍 *المحافظة:* ${city}\n` +
    `🏠 *العنوان:* ${address}\n` +
    `💳 *طريقة الدفع:* ${paymentMethod}\n` +
    (paymentRef ? `📝 *بيانات التحويل:* \`${paymentRef}\`\n` : '') +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 *المنتجات المطلوبة:*\n${itemsText}\n\n` +
    `💰 *الإجمالي النهائي:* *${total} ج.م*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `الحالة الحالية: ⏳ *قيد الانتظار (جديد)*`;

  const cleanPhone = customerPhone.replace(/\D+/g, '');
  const waPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ/ة ${customerName}، بخصوص طلبكِ رقم #ROMA-${order.order_number || orderId} من متجر روما:`)}`;

  // Inline action buttons: One-tap status updates matching user specifications:
  // [✅ تأكيد الطلب], [🚚 قيد الشحن], [✨ تم التسليم], [❌ إلغاء الطلب]
  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ تأكيد الطلب', callback_data: `ord_status_confirmed_${orderId}` },
        { text: '🚚 قيد الشحن', callback_data: `ord_status_shipped_${orderId}` },
      ],
      [
        { text: '✨ تم التسليم', callback_data: `ord_status_delivered_${orderId}` },
        { text: '❌ إلغاء الطلب', callback_data: `ord_status_cancelled_${orderId}` },
      ],
      [
        { text: '💬 محادثة العميلة عبر واتساب', url: waUrl },
      ],
    ],
  };

  const admins = getKnownAdmins();
  for (const adminId of admins) {
    if (order.payment_receipt_url && order.payment_receipt_url.startsWith('http')) {
      await tg('sendPhoto', {
        chat_id: adminId,
        photo: order.payment_receipt_url,
        caption,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard,
      });
    } else {
      await tg('sendMessage', {
        chat_id: adminId,
        text: caption,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard,
      });
    }
  }
}

// Supabase Realtime Listener Setup
function initSupabaseRealtime() {
  console.log('⚡ Initializing Supabase Realtime Listener for orders...');
  supabase
    .channel('orders-realtime-bot')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      async (payload) => {
        console.log('⚡ Realtime Order INSERT detected:', payload.new?.id, payload.new?.order_number);
        try {
          if (payload.new?.status !== 'cart_draft' && !payload.new?.order_number?.startsWith('CART-')) {
            await sendNewOrderNotification(payload.new);
          }
        } catch (err) {
          console.error('Realtime notification error:', err);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      async (payload) => {
        const newRow = payload.new;
        const oldRow = payload.old;
        console.log('⚡ Realtime Order UPDATE detected:', newRow?.order_number, 'Status:', newRow?.status);

        if (newRow && newRow.status !== oldRow?.status) {
          const targetPhone = newRow.phone || newRow.shipping_details?.phone;
          const cleanOrderId = String(newRow.order_number || newRow.id || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();

          const order = {
            orderId: cleanOrderId,
            orderNumber: newRow.order_number || `ROMA-${cleanOrderId}`,
            customerName: newRow.customer_name || newRow.shipping_details?.fullName || 'عميلة المتجر',
            customerPhone: targetPhone,
            shippingAddress: newRow.shipping_address || newRow.shipping_details?.fullAddress || '',
            totalAmount: newRow.total_amount,
            status: newRow.status,
            items: Array.isArray(newRow.items) ? newRow.items : [],
          };

          // Also save to local orders.json
          try {
            let orders = getOrders();
            const existingIdx = orders.findIndex(o => {
              const oClean = String(o.orderId || o.orderNumber || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
              return oClean === cleanOrderId;
            });
            if (existingIdx !== -1) {
              orders[existingIdx].status = newRow.status;
              orders[existingIdx].updatedAt = new Date().toISOString();
            } else {
              orders.unshift({ ...order, createdAt: newRow.created_at || new Date().toISOString() });
            }
            saveOrders(orders);
          } catch (_) {}

          // Auto-send WhatsApp message from +201505566847
          if (targetPhone && targetPhone !== 'غير مسجل') {
            try {
              if (newRow.status === 'confirmed') {
                console.log(`[WHATSAPP] Realtime auto-sending order confirmation to ${targetPhone}...`);
                await sendOrderConfirmationWhatsApp(order);
              } else if (['shipped', 'delivered', 'cancelled'].includes(newRow.status)) {
                console.log(`[WHATSAPP] Realtime auto-sending shipping status (${newRow.status}) to ${targetPhone}...`);
                await sendShippingUpdateWhatsApp(order, newRow.status);
              }
            } catch (waErr) {
              console.warn('[WHATSAPP] Realtime automated message error:', waErr?.message);
            }
          }
        }
      }
    )
    .subscribe((status) => {
      console.log(`⚡ Supabase Realtime Subscription: ${status}`);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setTimeout(() => {
          console.log('🔄 Reconnecting Supabase Realtime channel...');
          initSupabaseRealtime();
        }, 3000);
      }
    });
}

// ----------------- Abandoned Cart Recovery Runner -----------------

const ABANDONED_CARTS_FILE = path.join(__dirname, 'abandoned_carts.json');

async function checkAbandonedCartsRoutine() {
  try {
    if (fs.existsSync(ABANDONED_CARTS_FILE)) {
      try {
        const carts = JSON.parse(fs.readFileSync(ABANDONED_CARTS_FILE, 'utf8'));
        let fileUpdated = false;

        for (const cart of carts) {
          const lastActivity = cart.lastActivityAt || cart.createdAt || 0;
          const isOlderThan5Min = (Date.now() - lastActivity) >= 5 * 60 * 1000;

          if (cart.status === 'active' && !cart.recoverySent && isOlderThan5Min && cart.phone) {
            cart.recoverySent = true;
            cart.status = 'abandoned';
            cart.recoverySentAt = new Date().toISOString();
            fileUpdated = true;

            const coupon = 'ROMA10';
            const customerName = cart.customerName || 'عميلة المتجر';
            const phone = cart.phone;
            const recoveryUrl = `https://roma-eg.my/cart?recovery_id=${cart.id}&coupon=${coupon}`;

            console.log(`🛒 [ABANDONED CART] Inactive >= 5 mins detected for ${phone}. Auto-sending recovery via WhatsApp...`);

            // 📱 Send WhatsApp message from merchant (+201505566847) to customer
            try {
              await sendAbandonedCartWhatsApp({
                id: cart.id,
                customerName,
                customerPhone: phone,
                items: cart.items,
                recoveryUrl,
              });
            } catch (waErr) {
              console.warn('[WHATSAPP] Abandoned cart message error:', waErr?.message);
            }

            // 🔔 Notify admin on Telegram
            const msg =
              `🛒 *تنبيه سلة مهجورة (متروكة منذ 5 دقائق)*\n` +
              `━━━━━━━━━━━━━━━━━━\n` +
              `👤 *العميلة:* ${customerName}\n` +
              `📞 *الهاتف:* \`${phone}\`\n` +
              `💰 *قيمة السلة:* ${cart.total || 0} ج.م\n` +
              `🕒 *سلة متروكة منذ 5 دقائق*\n` +
              `🎟️ *تم إرسال كود خصم تلقائياً عبر واتساب:* \`${coupon}\` (-10%)\n` +
              `🔗 [رابط استعادة السلة](${recoveryUrl})`;

            const admins = getKnownAdmins();
            const cleanPhone = String(phone).replace(/\D+/g, '');
            const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone.startsWith('2') ? cleanPhone : '20' + cleanPhone;
            const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ/ة ${customerName}، نهديكِ كود خصم 10% إضافي ${coupon} لإكمال سلتكِ بمتجر روما: ${recoveryUrl}`)}`;

            for (const adminId of admins) {
              await tg('sendMessage', {
                chat_id: adminId,
                text: msg,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: 'واتساب العميلة 💬', url: waUrl }],
                  ],
                },
              });
            }
          }
        }

        if (fileUpdated) {
          fs.writeFileSync(ABANDONED_CARTS_FILE, JSON.stringify(carts, null, 2), 'utf8');
        }
      } catch (fErr) {
        console.warn('Local abandoned carts processing error:', fErr.message);
      }
    }
  } catch (err) {
    console.warn('Abandoned cart routine error:', err?.message);
  }
}

// ----------------- Update & Interaction Handler -----------------

async function handleUpdate(update) {
  const incomingChatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
  if (incomingChatId) {
    registerAdmin(incomingChatId);
  }

  // 1. Callback query handling
  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data;
    const userId = cb.from.id;
    const chatId = cb.message.chat.id;
    const msgId = cb.message.message_id;

    // Navigation: Dashboard
    if (data === 'nav_menu') {
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return tg('sendMessage', {
        chat_id: chatId,
        text: '🌿 *لوحة تحكم إدارة متجر Roma*\n\nاختر من الأقسام التالية:',
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
    }

    // Navigation: Import from Amazon
    if (data === 'nav_amazon_prod') {
      sessions.set(userId, { step: 'AMAZON_URL' });
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return tg('sendMessage', {
        chat_id: chatId,
        text:
          `🛒 *سحب ورفع منتج تلقائياً عبر رابط أمازون*\n\n` +
          `🔗 أرسل الآن *رابط المنتج* من موقع أمازون (مثال: \`amazon.eg\` أو \`amazon.com\` أو رابط مختصر \`amzn.to\`):\n\n` +
          `⚡ سيقوم البوت تلقائياً بـ:\n` +
          `• سحب الاسم بالكامل بدقة\n` +
          `• استخراج السعر بالجنيه وحساب الخصم\n` +
          `• تحميل الصور فائقة الدقة (HD) وحفظها بالمتجر\n` +
          `• سحب الوصف الكامل وقائمة المميزات\n` +
          `• التصنيف التلقائي الذكي للمنتج\n` +
          `• النشر المباشر والفوري في المتجر!`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 إلغاء والعودة للقائمة', callback_data: 'nav_menu' }],
          ],
        },
      });
    }

    // Navigation: Add Product
    if (data === 'nav_add_prod') {
      sessions.set(userId, { step: 'NAME', draft: {} });
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return tg('sendMessage', {
        chat_id: chatId,
        text: '🌱 *إضافة منتج جديد*\n\nالرجاء إرسال *اسم المنتج* (مثال: سيروم النضارة الفائق):',
        parse_mode: 'Markdown',
      });
    }

    // Navigation: List Products
    if (data === 'nav_list_prod') {
      adminProductSearches.delete(chatId);
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return sendProductsList(chatId, 0, '');
    }

    // Navigation: Search Products
    if (data === 'nav_search_prod') {
      sessions.set(userId, { step: 'SEARCH_PRODUCT' });
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      const total = getProducts().length;
      return tg('sendMessage', {
        chat_id: chatId,
        text:
          `🔍 *البحث في منتجات المتجر (${total} منتج)*:\n\n` +
          `أرسل الآن *اسم المنتج* أو *جزء من الاسم* أو *كود المنتج* أو *التصنيف*:\n` +
          `*(مثال: \`توكة\` أو \`سيروم\` أو \`شعر\` أو \`1790739165623\`)*`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 إلغاء والعودة لقائمة المنتجات', callback_data: 'nav_list_prod' }],
          ],
        },
      });
    }

    // Product Pagination
    if (data.startsWith('prod_page_')) {
      const page = parseInt(data.replace('prod_page_', ''), 10) || 0;
      const currentQuery = adminProductSearches.get(chatId) || '';
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return sendProductsList(chatId, page, currentQuery);
    }

    if (data === 'prod_noop') {
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return;
    }

    // Navigation: Check Abandoned Carts
    if (data === 'nav_check_abandoned') {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'جاري فحص السلات المتروكة...' });
      await checkAbandonedCartsRoutine();
      return tg('sendMessage', {
        chat_id: chatId,
        text: '✅ *تم فحص السلات المتروكة بنجاح وإرسال التنبيهات للأدمن!*',
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
    }

    // Navigation: Stats
    if (data === 'nav_stats') {
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return sendStoreStats(chatId);
    }

    // Navigation: Orders
    if (data.startsWith('nav_orders_')) {
      const filter = data.replace('nav_orders_', '');
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return sendOrdersList(chatId, filter);
    }

    // Category selection in wizard
    if (data.startsWith('cat_')) {
      const category = data.replace('cat_', '');
      let session = sessions.get(userId);
      if (!session) {
        session = {
          step: 'CATEGORY',
          draft: { nameAr: 'سيروم زيت الفيف اكسترا اورديناري من لوريال باريس لأنواع الشعر الجاف، 100 مل' },
        };
        sessions.set(userId, session);
      } else if (!session.draft.nameAr) {
        session.draft.nameAr = 'سيروم زيت الفيف اكسترا اورديناري من لوريال باريس لأنواع الشعر الجاف، 100 مل';
      }
      session.draft.category = category;
      session.step = 'PRICE';
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return tg('sendMessage', {
        chat_id: chatId,
        text: `✅ تم اختيار التصنيف: *${category}*\n\nأرسل الآن *سعر المنتج* بالجنيه المصري (مثال: \`245\`):`,
        parse_mode: 'Markdown',
      });
    }

    // Done uploading photos
    if (data === 'done_photos') {
      const session = sessions.get(userId);
      if (session && session.step === 'PHOTO') {
        const count = session.draft.images?.length || 0;
        if (count === 0 && !session.draft.imageUrl) {
          await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'يرجى إرسال صورة واحدة على الأقل أولاً 📷' });
          return;
        }
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'جاري حفظ ونشر المنتج...' });
        return finalizeProduct(chatId, userId, session);
      }
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return;
    }

    if (data === 'more_photos_hint') {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'أرسل الصورة التالية من المعرض أو الكاميرا مباشرة 📷' });
      return;
    }

    // Product actions: Edit price
    if (data.startsWith('edit_price_')) {
      const id = parseInt(data.replace('edit_price_', ''), 10);
      const products = getProducts();
      const p = products.find((prod) => prod.id === id);
      if (!p) {
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'المنتج غير موجود' });
        return;
      }
      sessions.set(userId, { step: 'EDIT_PRICE', targetId: id, productName: p.nameAr });
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return tg('sendMessage', {
        chat_id: chatId,
        text: `✏️ *تعديل سعر:* ${p.nameAr}\nالسعر الحالي: *${p.price} ج.م*\n\nأرسل *السعر الجديد* بالجنيه المصري:`,
        parse_mode: 'Markdown',
      });
    }

    // Product actions: Edit stock
    if (data.startsWith('edit_stock_')) {
      const id = parseInt(data.replace('edit_stock_', ''), 10);
      const products = getProducts();
      const p = products.find((prod) => prod.id === id);
      if (!p) {
        await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'المنتج غير موجود' });
        return;
      }
      sessions.set(userId, { step: 'EDIT_STOCK', targetId: id, productName: p.nameAr });
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return tg('sendMessage', {
        chat_id: chatId,
        text: `📦 *تعديل كمية المخزون:* ${p.nameAr}\nالمخزون الحالي: *${p.stock ?? 50} قطعة*\n\nأرسل *الكمية الجديدة المتوفرة* في المخزون:`,
        parse_mode: 'Markdown',
      });
    }

    // Product actions: Delete product
    if (data.startsWith('del_prod_')) {
      const id = parseInt(data.replace('del_prod_', ''), 10);
      let products = getProducts();
      const target = products.find((p) => p.id === id);
      products = products.filter((p) => p.id !== id);
      saveProducts(products, `Delete product ${target?.nameAr || id}`);
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'تم حذف المنتج بنجاح' });
      return tg('sendMessage', {
        chat_id: chatId,
        text: `🗑️ تم حذف المنتج: *${target?.nameAr || id}* بنجاح وتحديث المتجر المباشر!`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
    }

    // Normalize legacy/alternative callbacks
    let actionData = data;
    if (data.startsWith('accept_') || data.startsWith('confirm_')) {
      actionData = `ord_status_confirmed_${data.replace(/^(accept_|confirm_)/, '')}`;
    } else if (data.startsWith('ship_')) {
      actionData = `ord_status_shipped_${data.replace('ship_', '')}`;
    } else if (data.startsWith('deliver_')) {
      actionData = `ord_status_delivered_${data.replace('deliver_', '')}`;
    } else if (data.startsWith('cancel_')) {
      actionData = `ord_status_cancelled_${data.replace('cancel_', '')}`;
    }

    // Add Carrier Tracking URL Callback
    if (data.startsWith('add_track_')) {
      const rawOrderId = data.replace('add_track_', '');
      const cleanOrderId = String(rawOrderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
      sessions.set(userId, { step: 'AWAIT_TRACKING_URL', targetOrderId: cleanOrderId });
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return tg('sendMessage', {
        chat_id: chatId,
        text:
          `🚚 *إضافة رابط تتبع الشحنة للطلب #ROMA-${cleanOrderId}*\n\n` +
          `أرسل الآن رابط التتبع الخاص بشركة الشحن (مثال: رابط بوسطة Bosta أو مايلرز أو أرامكس):\n` +
          `*(مثال: \`https://bosta.co/tracking/123456\`)*\n\n` +
          `بمجرد إرسال الرابط، سيتم تفعيل زر "تتبع الشحنة" فوراً للعميل في حسابه بالمتجر!`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ إلغاء', callback_data: 'nav_orders_all' }],
          ],
        },
      });
    }

    // =========================================================================
    // 6. ONE-TAP INLINE STATUS UPDATES (confirmed, shipped, delivered, cancelled)
    // =========================================================================
    if (actionData.startsWith('ord_status_')) {
      const parts = actionData.replace('ord_status_', '').split('_');
      const newStatusKey = parts[0];
      const rawOrderId = parts.slice(1).join('_');
      const cleanOrderId = String(rawOrderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();

      let orders = getOrders();
      let order = orders.find(
        (o) => {
          const locClean = String(o.orderId || o.orderNumber || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
          return (
            String(o.orderId) === String(rawOrderId) ||
            String(o.orderNumber) === String(rawOrderId) ||
            locClean === cleanOrderId ||
            (cleanOrderId.length >= 4 && (locClean.includes(cleanOrderId) || cleanOrderId.includes(locClean)))
          );
        }
      );

      const statusObj = STATUS_MAP[newStatusKey] || { label: newStatusKey };

      // Update Supabase Database record safely with flexible ILIKE and UUID matching
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanOrderId);
        const sbClient = await getAuthenticatedSupabase();
        const filterOr = isUuid
          ? `id.eq.${cleanOrderId},order_number.ilike.%${cleanOrderId}%,order_number.eq.ROMA-${cleanOrderId},order_number.eq.${cleanOrderId}`
          : `order_number.ilike.%${cleanOrderId}%,order_number.eq.ROMA-${cleanOrderId},order_number.eq.${cleanOrderId}`;

        let { data: updatedRows, error: sbErr } = await sbClient
          .from('orders')
          .update({ status: newStatusKey })
          .or(filterOr)
          .select();

        // If not found by filterOr, try looking up recent orders to find the match
        if ((!updatedRows || updatedRows.length === 0) && cleanOrderId.length >= 4) {
          const { data: allRecent } = await sbClient.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
          if (Array.isArray(allRecent)) {
            const matchedRow = allRecent.find((r) => {
              const rClean = String(r.order_number || r.id).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
              return rClean.includes(cleanOrderId) || cleanOrderId.includes(rClean);
            });
            if (matchedRow) {
              const res = await sbClient.from('orders').update({ status: newStatusKey }).eq('id', matchedRow.id).select();
              if (res.data && res.data.length > 0) {
                updatedRows = res.data;
              }
            }
          }
        }

        if (sbErr) {
          console.warn('Supabase status update error:', sbErr.message);
        } else {
          console.log(`[BOT] Order ${cleanOrderId} status updated to ${newStatusKey} in Supabase:`, updatedRows?.length, 'rows');
        }

        const sbRow = updatedRows && updatedRows[0];
        if (sbRow) {
          if (!order) {
            order = {
              orderId: cleanOrderId,
              orderNumber: sbRow.order_number || `ROMA-${cleanOrderId}`,
              customerName: sbRow.shipping_details?.fullName || sbRow.customer_name || 'عميلة المتجر',
              customerPhone: sbRow.phone || sbRow.shipping_details?.phone || 'غير مسجل',
              shippingAddress: sbRow.shipping_details?.fullAddress || sbRow.shipping_address || 'غير محدد',
              totalAmount: sbRow.total_amount,
              status: newStatusKey,
              paymentMethod: sbRow.payment_method || 'الدفع عند الاستلام',
              items: Array.isArray(sbRow.items) ? sbRow.items : [],
              createdAt: sbRow.created_at,
              updatedAt: new Date().toISOString(),
            };
            orders.unshift(order);
          } else {
            order.status = newStatusKey;
            order.customerPhone = sbRow.phone || sbRow.shipping_details?.phone || order.customerPhone;
            order.customerName = sbRow.shipping_details?.fullName || sbRow.customer_name || order.customerName;
            order.shippingAddress = sbRow.shipping_details?.fullAddress || sbRow.shipping_address || order.shippingAddress;
            order.totalAmount = sbRow.total_amount || order.totalAmount;
            order.items = sbRow.items || order.items;
            order.updatedAt = new Date().toISOString();
          }
        } else {
          if (order) {
            order.status = newStatusKey;
            order.updatedAt = new Date().toISOString();
          } else {
            order = {
              orderId: cleanOrderId,
              orderNumber: `ROMA-${cleanOrderId}`,
              status: newStatusKey,
              updatedAt: new Date().toISOString(),
              customerName: 'عميلة المتجر',
            };
            orders.unshift(order);
          }
        }
        saveOrders(orders);

        // 📱 Automatically send WhatsApp message to customer from +201505566847 without human intervention
        try {
          const targetPhone = order.customerPhone || order.phone;
          if (targetPhone && targetPhone !== 'غير مسجل') {
            if (newStatusKey === 'confirmed') {
              console.log(`[WHATSAPP] Auto-sending order confirmation to ${targetPhone}...`);
              await sendOrderConfirmationWhatsApp(order);
            } else if (['shipped', 'delivered', 'cancelled'].includes(newStatusKey)) {
              console.log(`[WHATSAPP] Auto-sending shipping status (${newStatusKey}) to ${targetPhone}...`);
              await sendShippingUpdateWhatsApp(order, newStatusKey);
            }
          } else {
            console.warn(`[WHATSAPP] Order ${cleanOrderId} has no customer phone number. Message skipped.`);
          }
        } catch (waErr) {
          console.warn('[WHATSAPP] Automated message notice:', waErr?.message);
        }
      } catch (err) {
        console.warn('Supabase status update exception:', err?.message);
      }

      await tg('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: `تم تحديث الحالة إلى: ${statusObj.label}`,
      });

      // Cleanly replace old status in message text/caption
      const rawContent = cb.message.caption !== undefined ? (cb.message.caption || '') : (cb.message.text || '');
      // Strip any previously appended update notices
      let baseContent = rawContent.replace(/\n*📌 \*?تحديث الحالة:\*?[\s\S]*?(?=\n\n|\n*$|$)/gi, '').trim();
      // Replace the main status line
      const statusRegex = /(الحالة|الحالة الحالية):[^\n]*/i;
      if (statusRegex.test(baseContent)) {
        baseContent = baseContent.replace(statusRegex, `الحالة: *${statusObj.label}*`);
      } else {
        baseContent += `\n━━━━━━━━━━━━━━━━━━\nالحالة: *${statusObj.label}*`;
      }

      const updateNotice = `\n\n📌 *آخر تحديث:* ${statusObj.label}\n🕒 *التوقيت:* ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
      const finalContent = baseContent + updateNotice;

      const newKeyboard = {
        inline_keyboard: [
          [
            { text: newStatusKey === 'confirmed' ? '✅ مؤكد حالياً' : '✅ تأكيد الطلب', callback_data: `ord_status_confirmed_${cleanOrderId}` },
            { text: newStatusKey === 'shipped' ? '🚚 قيد الشحن حالياً' : '🚚 قيد الشحن', callback_data: `ord_status_shipped_${cleanOrderId}` },
          ],
          [
            { text: newStatusKey === 'delivered' ? '✨ تم التسليم حالياً' : '✨ تم التسليم', callback_data: `ord_status_delivered_${cleanOrderId}` },
            { text: newStatusKey === 'cancelled' ? '❌ ملغي حالياً' : '❌ إلغاء الطلب', callback_data: `ord_status_cancelled_${cleanOrderId}` },
          ],
          [
            { text: '🔗 إضافة / تعديل رابط التتبع 🚚', callback_data: `add_track_${cleanOrderId}` },
          ],
          [
            { text: '📋 عرض كل الطلبات', callback_data: 'nav_orders_all' },
          ],
        ],
      };

      if (cb.message.caption !== undefined) {
        await tg('editMessageCaption', {
          chat_id: chatId,
          message_id: msgId,
          caption: finalContent,
          parse_mode: 'Markdown',
          reply_markup: newKeyboard,
        });
      } else {
        await tg('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: finalContent,
          parse_mode: 'Markdown',
          reply_markup: newKeyboard,
        });
      }

      return;
    }

    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    return;
  }

  // 2. Text message handling & Admin commands
  if (update.message?.text) {
    const text = update.message.text.trim();
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;

    const normalized = text.toLowerCase();
    const isStartOrMenu =
      normalized.startsWith('/start') ||
      normalized.startsWith('/menu') ||
      normalized.startsWith('/help') ||
      normalized === 'start' ||
      normalized === 'menu' ||
      normalized === 'بدء' ||
      normalized === 'ابدأ' ||
      normalized === 'ابدا' ||
      normalized === 'القائمة' ||
      normalized === 'قائمة' ||
      normalized === 'مرحبا' ||
      normalized === 'هلا' ||
      normalized === 'سلام' ||
      normalized === 'السلام عليكم' ||
      normalized === 'اوامر' ||
      normalized === 'أوامر' ||
      normalized === 'لوحة التحكم';

    if (isStartOrMenu) {
      sessions.delete(userId);
      return tg('sendMessage', {
        chat_id: chatId,
        text:
          `🌿 *أهلاً بك في نظام إدارة متجر Roma Store الذكي!*\n\n` +
          `المتجر مرتبط ومفعل بالكامل على [roma-eg.my](https://roma-eg.my).\n\n` +
          `🛠️ يمكنك إدارة الطلبات، وتعديل المنتجات والمخزون، وتأكيد وشحن الطلبات واستعادة السلات المتروكة:`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
    }

    // Admin Command: /stock <product_id> <quantity>
    if (text.startsWith('/stock')) {
      const parts = text.split(' ').filter(Boolean);
      if (parts.length >= 3) {
        const prodId = parts[1];
        const newQty = parseInt(parts[2], 10);
        if (!isNaN(newQty)) {
          let products = getProducts();
          const target = products.find((p) => String(p.id) === String(prodId) || p.slug === prodId);
          if (target) {
            target.stock = newQty;
            saveProducts(products, `Stock update: ${target.nameAr} = ${newQty}`);
            return tg('sendMessage', {
              chat_id: chatId,
              text: `✅ *تم تحديث المخزون بنجاح!*\n\n📦 *${target.nameAr}*\n📊 الكمية المتوفرة حالياً: *${newQty} قطعة*`,
              parse_mode: 'Markdown',
            });
          }
        }
      }
      return tg('sendMessage', {
        chat_id: chatId,
        text: 'ℹ️ *طريقة تعديل المخزون:* أرسلي:\n`/stock <كود_المنتج> <الكمية>`\nمثال: `/stock 1 25` أو اختاري المنتج من زر *إدارة المنتجات والمخزون*.',
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
    }

    if (text === '/abandoned') {
      await checkAbandonedCartsRoutine();
      return tg('sendMessage', {
        chat_id: chatId,
        text: '✅ *تم إجراء فحص السلات المتروكة وإشعار العملاء بالكوبونات بنجاح!*',
        parse_mode: 'Markdown',
      });
    }

    if (text.startsWith('/track') || text.startsWith('تتبع ')) {
      const parts = text.split(/\s+/).filter(Boolean);
      if (parts.length >= 3) {
        const cleanId = String(parts[1]).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
        const url = parts.slice(2).join(' ').trim();
        await saveOrderTrackingUrl(cleanId, url);
        return tg('sendMessage', {
          chat_id: chatId,
          text:
            `✅ *تم تفعيل وحفظ رابط تتبع الشحنة للطلب بنجاح!*\n\n` +
            `📦 *رقم الطلب:* #ROMA-${cleanId}\n` +
            `🔗 *رابط الشحنة:* ${url}\n` +
            `🚚 *الحالة:* قيد الشحن (Shipped)\n\n` +
            `✨ يستطيع العميل الآن تتبع شحنته مباشرة بالضغط على زر "تتبع الشحنة" في حسابه!`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(),
        });
      } else {
        return tg('sendMessage', {
          chat_id: chatId,
          text:
            `ℹ️ *طريقة إضافة رابط تتبع الشحنة:*\n\n` +
            `أرسل الأمر بالتنسيق التالي:\n` +
            `\`/track <رقم_الطلب> <رابط_شركة_الشحن>\`\n\n` +
            `مثال:\n` +
            `\`/track 1001 https://bosta.co/tracking/12345\`\n\n` +
            `أو اضغط مباشرة على زر *🔗 إضافة رابط تتبع الشحنة 🚚* أسفل إشعار الطلب في البوت!`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(),
        });
      }
    }

    if (text.startsWith('/amazon') || text.startsWith('/amz')) {
      const parts = text.split(' ').filter(Boolean);
      if (parts.length > 1 && parts[1].includes('http')) {
        return handleAmazonImport(chatId, userId, parts[1]);
      }
      sessions.set(userId, { step: 'AMAZON_URL' });
      return tg('sendMessage', {
        chat_id: chatId,
        text:
          `🛒 *سحب ورفع منتج تلقائياً عبر رابط أمازون*\n\n` +
          `أرسل الآن *رابط المنتج* من موقع أمازون لسحبه ونشره فوراً في متجر Roma:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 إلغاء والعودة للقائمة', callback_data: 'nav_menu' }],
          ],
        },
      });
    }

    if (text === '/add_product' || text === '/new_product') {
      sessions.set(userId, { step: 'NAME', draft: {} });
      return tg('sendMessage', {
        chat_id: chatId,
        text: '🌱 *إضافة منتج جديد*\n\nالرجاء إرسال *اسم المنتج* (مثال: سيروم النضارة الفائق):',
        parse_mode: 'Markdown',
      });
    }

    if (text === '/products' || text === '/prods' || text === '/المنتجات') {
      adminProductSearches.delete(chatId);
      return sendProductsList(chatId, 0, '');
    }

    if (text.startsWith('/search') || text.startsWith('/find') || text.startsWith('/بحث')) {
      const q = text.replace(/^(\/search|\/find|\/بحث)\s*/i, '').trim();
      if (q) {
        adminProductSearches.set(chatId, q);
        return sendProductsList(chatId, 0, q);
      }
      sessions.set(userId, { step: 'SEARCH_PRODUCT' });
      const total = getProducts().length;
      return tg('sendMessage', {
        chat_id: chatId,
        text: `🔍 *البحث في منتجات المتجر (${total} منتج)*:\n\nأرسل الآن اسم المنتج أو جزء منه للبحث عنه مباشرة:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 إلغاء والعودة لقائمة المنتجات', callback_data: 'nav_list_prod' }],
          ],
        },
      });
    }

    if (text === '/orders') {
      return sendOrdersList(chatId, 'all');
    }

    if (text === '/stats') {
      return sendStoreStats(chatId);
    }

    // Auto-detect Amazon product links in any incoming text message
    const amazonLinkRegex = /(https?:\/\/(?:www\.)?(?:amazon\.[a-z.]+|amzn\.[a-z]+)\/[^\s]+)/i;
    if (amazonLinkRegex.test(text)) {
      const matched = text.match(amazonLinkRegex)[0];
      return handleAmazonImport(chatId, userId, matched);
    }

    // Step machine for adding or editing
    const session = sessions.get(userId);
    if (session) {
      // Search product step
      if (session.step === 'SEARCH_PRODUCT') {
        sessions.delete(userId);
        const query = text.trim();
        adminProductSearches.set(chatId, query);
        return sendProductsList(chatId, 0, query);
      }

      // Amazon URL input step
      if (session.step === 'AMAZON_URL') {
        if (text.includes('http')) {
          return handleAmazonImport(chatId, userId, text.trim());
        }
        return tg('sendMessage', {
          chat_id: chatId,
          text: '⚠️ يرجى إرسال رابط صحيح يبدأ بـ http:// أو https:// (مثال: رابط أمازون أو amzn.to):',
        });
      }

      // Edit stock step
      if (session.step === 'EDIT_STOCK') {
        const newQty = parseInt(text, 10);
        if (isNaN(newQty) || newQty < 0) {
          return tg('sendMessage', {
            chat_id: chatId,
            text: '⚠️ يرجى إدخال رقم كمية صحيح (مثال: `20`):',
          });
        }
        let products = getProducts();
        const p = products.find((prod) => prod.id === session.targetId);
        if (p) {
          p.stock = newQty;
          saveProducts(products, `Edit stock of ${p.nameAr} to ${newQty}`);
        }
        sessions.delete(userId);
        return tg('sendMessage', {
          chat_id: chatId,
          text: `✅ *تم تحديث كمية المخزون بنجاح!*\n\n📦 *${session.productName}*\n📊 المخزون الحالي: *${newQty} قطعة*`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(),
        });
      }

      // Awaiting tracking URL for an order
      if (session.step === 'AWAIT_TRACKING_URL') {
        const targetId = session.targetOrderId;
        const cleanUrl = text.trim();
        sessions.delete(userId);

        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          return tg('sendMessage', {
            chat_id: chatId,
            text: '⚠️ الرابط غير صحيح. يرجى إرسال رابط يبدأ بـ `https://` أو `http://` (مثال: رابط بوسطة Bosta أو مايلرز أو أرامكس).',
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard(),
          });
        }

        await saveOrderTrackingUrl(targetId, cleanUrl);

        return tg('sendMessage', {
          chat_id: chatId,
          text:
            `✅ *تم حفظ وتفعيل رابط تتبع الشحنة بنجاح!*\n\n` +
            `📦 *رقم الطلب:* #ROMA-${targetId}\n` +
            `🔗 *رابط شركة الشحن:* ${cleanUrl}\n` +
            `🚚 *الحالة الجديدة:* قيد الشحن (Shipped)\n\n` +
            `✨ يستطيع العميل الآن تتبع الشحنة مباشرة عبر زر "تتبع الشحنة" في حسابه!`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(),
        });
      }

      // Edit price step
      if (session.step === 'EDIT_PRICE') {
        const newPrice = parseFloat(text);
        if (isNaN(newPrice) || newPrice <= 0) {
          return tg('sendMessage', {
            chat_id: chatId,
            text: '⚠️ يرجى إدخال رقم صحيح للسعر (مثال: `220`):',
          });
        }
        let products = getProducts();
        const p = products.find((prod) => prod.id === session.targetId);
        if (p) {
          p.price = newPrice;
          p.compareAtPrice = Math.round(newPrice * 1.25);
          saveProducts(products, `Edit price of ${p.nameAr} to ${newPrice}`);
        }
        sessions.delete(userId);
        return tg('sendMessage', {
          chat_id: chatId,
          text: `✅ *تم تحديث سعر المنتج بنجاح!*\n\n📦 *${session.productName}*\n💰 السعر الجديد: *${newPrice} ج.م*`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(),
        });
      }

      // Add product wizard: Name -> Category
      if (session.step === 'NAME') {
        session.draft.nameAr = text;
        session.step = 'CATEGORY';
        return tg('sendMessage', {
          chat_id: chatId,
          text: `📦 اسم المنتج: *${text}*\n\nاختر *تصنيف المنتج* من الأزرار أدناه، أو اكتب اسم التصنيف مباشرة:`,
          parse_mode: 'Markdown',
          reply_markup: getCategoryKeyboard(),
        });
      }

      // Add product wizard: Category text input fallback
      if (session.step === 'CATEGORY') {
        const cat = text.trim();
        session.draft.category = cat;
        session.step = 'PRICE';
        return tg('sendMessage', {
          chat_id: chatId,
          text: `✅ تم تعيين التصنيف: *${cat}*\n\nأرسل الآن *سعر المنتج* بالجنيه المصري (مثال: \`245\`):`,
          parse_mode: 'Markdown',
        });
      }

      // Price -> Description
      if (session.step === 'PRICE') {
        const p = parseFloat(text);
        if (isNaN(p) || p <= 0) {
          return tg('sendMessage', {
            chat_id: chatId,
            text: '⚠️ يرجى إدخال رقم سعر صحيح (مثال: `180`):',
          });
        }
        session.draft.price = p;
        session.step = 'DESC';
        return tg('sendMessage', {
          chat_id: chatId,
          text: '📝 أرسل الآن *وصف المنتج ومميزاته* (أو أرسل نقطة `.` لتوليد وصف فاخر تلقائي):',
          parse_mode: 'Markdown',
        });
      }

      // Description -> Photo
      if (session.step === 'DESC') {
        session.draft.descriptionAr =
          text === '.'
            ? `مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.`
            : text;
        session.draft.images = [];
        session.step = 'PHOTO';
        return tg('sendMessage', {
          chat_id: chatId,
          text:
            '📷 *خطوة رفع صور المنتج (متعدد الصور):*\n\n' +
            '• يمكنك إرسال *صورة واحدة أو عدة صور* (ألبوم صور من المعرض أو صورة تلو الأخرى).\n' +
            '• يمكنك أيضاً إرسال رابط صورة مباشر (URL).\n\n' +
            '🚀 عند الانتهاء من إرسال الصور، اضغط على زر *نشر المنتج في المتجر* الذي سيظهر لك.',
          parse_mode: 'Markdown',
        });
      }

      // Photo as URL text or Done command
      if (session.step === 'PHOTO') {
        session.draft.images = session.draft.images || [];
        const clean = text.trim();
        const lower = clean.toLowerCase();

        if (lower === 'تم' || lower === 'نشر' || lower === 'done' || lower === 'حفظ' || lower === '.' || lower === 'خلاص') {
          if (session.draft.images.length > 0) {
            return finalizeProduct(chatId, userId, session);
          } else {
            return tg('sendMessage', {
              chat_id: chatId,
              text: '⚠️ يرجى إرسال صورة واحدة على الأقل أولاً (من الكاميرا أو المعرض):',
            });
          }
        }

        if (clean.includes('http')) {
          const urls = clean.split(/[\s\n]+/).filter((u) => u.startsWith('http'));
          urls.forEach((u) => session.draft.images.push(u));
          const count = session.draft.images.length;
          return tg('sendMessage', {
            chat_id: chatId,
            text:
              `🔗 *تمت إضافة ${urls.length} ${urls.length === 1 ? 'رابط صورة' : 'روابط صور'} بنجاح!* (إجمالي الصور: ${count})\n\n` +
              `• يمكنك إرسال صور إضافية أو روابط أخرى.\n` +
              `• أو اضغط على الزر أدناه لنشر المنتج فوراً:`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: `🚀 نشر المنتج في المتجر (${count} ${count === 1 ? 'صورة' : 'صور'})`, callback_data: 'done_photos' },
                ],
              ],
            },
          });
        }
      }
    }

    // Default friendly response for any other incoming text
    return tg('sendMessage', {
      chat_id: chatId,
      text: '🌿 *لوحة تحكم إدارة متجر Roma*\n\nيرجى الاختيار من القائمة أدناه، أو إرسال `/start` للبدء من جديد:',
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
  }

  // 3. Photo upload in wizard (supports single, multiple, or albums)
  if (update.message?.photo) {
    const userId = update.message.from.id;
    const chatId = update.message.chat.id;
    const session = sessions.get(userId);

    if (session && session.step === 'PHOTO') {
      session.draft.images = session.draft.images || [];
      const photos = update.message.photo;
      const best = photos[photos.length - 1];
      const localUrl = await downloadTelegramPhoto(best.file_id);
      if (localUrl) {
        session.draft.images.push(localUrl);
      }

      const count = session.draft.images.length;
      return tg('sendMessage', {
        chat_id: chatId,
        text:
          `📸 *تم استلام الصورة (${count}) بنجاح!*\n\n` +
          `• إذا أردت إضافة *صور أخرى* لنفس المنتج، أرسلها الآن من المعرض أو الكاميرا.\n` +
          `• عند الانتهاء، اضغط على زر *نشر المنتج في المتجر* أدناه:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: `🚀 نشر المنتج في المتجر (${count} ${count === 1 ? 'صورة' : 'صور'})`, callback_data: 'done_photos' },
            ],
            [
              { text: '➕ أرسل صورة أخرى (أو ألبوم)', callback_data: 'more_photos_hint' },
            ],
          ],
        },
      });
    }
  }
}

// ----------------- Product & Order Renderers -----------------

async function sendProductsList(chatId, page = 0, query = '') {
  const allProducts = getProducts();
  if (allProducts.length === 0) {
    return tg('sendMessage', {
      chat_id: chatId,
      text: 'لا توجد منتجات مسجلة في المتجر حالياً.',
      reply_markup: getMainKeyboard(),
    });
  }

  const cleanQuery = (query || '').trim().toLowerCase();
  const filtered = cleanQuery
    ? allProducts.filter((p) => {
        const name = (p.nameAr || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const desc = (p.descriptionAr || '').toLowerCase();
        const id = String(p.id || '');
        const slug = (p.slug || '').toLowerCase();
        return name.includes(cleanQuery) || cat.includes(cleanQuery) || desc.includes(cleanQuery) || id.includes(cleanQuery) || slug.includes(cleanQuery);
      })
    : allProducts;

  if (filtered.length === 0) {
    return tg('sendMessage', {
      chat_id: chatId,
      text: `🔍 *لم نجد أي منتجات مطابقة للبحث:* \`${query}\`\n\nجرّب البحث بكلمة أو كود آخر، أو استعرض جميع منتجات المتجر:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 تجربة بحث آخر', callback_data: 'nav_search_prod' }],
          [{ text: '📋 عرض كل المنتجات', callback_data: 'nav_list_prod' }],
          [{ text: '🔙 القائمة الرئيسية', callback_data: 'nav_menu' }],
        ],
      },
    });
  }

  const PAGE_SIZE = 6;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const buttons = [];
  slice.forEach((p) => {
    const titleSnippet = (p.nameAr || '').length > 34 ? (p.nameAr || '').slice(0, 31) + '...' : p.nameAr;
    buttons.push([
      { text: `📦 ${titleSnippet}`, callback_data: `edit_price_${p.id}` },
    ]);
    buttons.push([
      { text: `💰 ${p.price} ج (تعديل)`, callback_data: `edit_price_${p.id}` },
      { text: `📊 ${p.stock ?? 50} ق (مخزون)`, callback_data: `edit_stock_${p.id}` },
      { text: `🗑️ حذف`, callback_data: `del_prod_${p.id}` },
    ]);
  });

  // Pagination navigation row
  if (totalPages > 1) {
    const navRow = [];
    if (safePage > 0) {
      navRow.push({ text: '⬅️ السابق', callback_data: `prod_page_${safePage - 1}` });
    }
    navRow.push({ text: `📄 ${safePage + 1} / ${totalPages}`, callback_data: 'prod_noop' });
    if (safePage < totalPages - 1) {
      navRow.push({ text: 'التالي ➡️', callback_data: `prod_page_${safePage + 1}` });
    }
    buttons.push(navRow);
  }

  // Quick Action Buttons: Search, Cancel Search, Add, Menu
  const searchRow = [{ text: '🔍 بحث عن منتج', callback_data: 'nav_search_prod' }];
  if (cleanQuery) {
    searchRow.push({ text: '❌ إلغاء البحث وعرض الكل', callback_data: 'nav_list_prod' });
  }
  buttons.push(searchRow);

  buttons.push([
    { text: '📦 سحب منتج من أمازون 🛒', callback_data: 'nav_amazon_prod' },
    { text: '➕ إضافة يدوي', callback_data: 'nav_add_prod' },
  ]);
  buttons.push([{ text: '🔙 القائمة الرئيسية', callback_data: 'nav_menu' }]);

  let headerText = `🏷️ *إدارة المنتجات والمخزون*\n`;
  if (cleanQuery) {
    headerText += `🔍 *نتائج البحث عن:* "${query}"\n`;
    headerText += `📊 وُجد *${filtered.length}* منتج من أصل *${allProducts.length}* (صفحة ${safePage + 1} من ${totalPages}):\n\n`;
  } else {
    headerText += `📊 إجمالي المنتجات: *${allProducts.length}* منتج (صفحة ${safePage + 1} من ${totalPages}):\n\n`;
  }
  headerText += `اضغط على *السعر* أو *المخزون* للتعديل الفوري، أو *حذف* للإزالة:`;

  return tg('sendMessage', {
    chat_id: chatId,
    text: headerText,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
  });
}

async function saveOrderTrackingUrl(cleanOrderId, trackingUrl) {
  let orders = getOrders();
  let found = orders.find(
    (o) => {
      const locClean = String(o.orderId || o.orderNumber || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
      return locClean === cleanOrderId || locClean.includes(cleanOrderId) || cleanOrderId.includes(locClean);
    }
  );
  if (found) {
    found.tracking_url = trackingUrl;
    found.status = 'shipped';
    found.updatedAt = new Date().toISOString();
  } else {
    found = {
      orderId: cleanOrderId,
      orderNumber: `ROMA-${cleanOrderId}`,
      status: 'shipped',
      tracking_url: trackingUrl,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      customerName: 'عميلة المتجر',
    };
    orders.unshift(found);
  }
  saveOrders(orders);

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanOrderId);
    const sbClient = await getAuthenticatedSupabase();
    const filterOr = isUuid
      ? `id.eq.${cleanOrderId},order_number.ilike.%${cleanOrderId}%,order_number.eq.ROMA-${cleanOrderId},order_number.eq.${cleanOrderId}`
      : `order_number.ilike.%${cleanOrderId}%,order_number.eq.ROMA-${cleanOrderId},order_number.eq.${cleanOrderId}`;

    await sbClient
      .from('orders')
      .update({ tracking_url: trackingUrl, status: 'shipped', updated_at: new Date().toISOString() })
      .or(filterOr);
    console.log(`[BOT] Saved tracking_url for order ${cleanOrderId}: ${trackingUrl}`);
  } catch (err) {
    console.warn('[BOT] Supabase tracking update error:', err?.message);
  }

  // Also auto-notify customer via WhatsApp if possible
  try {
    const targetPhone = found.customerPhone || found.phone;
    if (targetPhone && targetPhone !== 'غير مسجل') {
      await sendShippingUpdateWhatsApp(found, 'shipped');
    }
  } catch (_) {}

  return true;
}

async function sendOrdersList(chatId, filter = 'all') {
  const allOrders = await getAllOrdersCombined();

  let orders = allOrders;
  if (filter !== 'all') {
    orders = allOrders.filter((o) => (o.status || 'pending') === filter);
  }

  let text = `📦 *سجل طلبات متجر Roma* [${filter === 'all' ? 'جميع الطلبات' : filter}]:\n\n`;

  if (orders.length === 0) {
    text += 'لا توجد طلبات مسجلة بهذا الفلتر حالياً.';
  } else {
    orders.slice(0, 8).forEach((o, index) => {
      const statusObj = STATUS_MAP[o.status] || { label: o.status || 'قيد الانتظار' };
      text += `*${index + 1}. طلب #${o.orderNumber || o.orderId}*\n`;
      text += `👤 *العميلة:* ${o.customerName}\n`;
      text += `📞 *الهاتف:* \`${o.customerPhone}\`\n`;
      text += `📍 *العنوان:* ${o.shippingAddress}\n`;
      text += `💰 *المبلغ:* ${o.totalAmount} ج.م\n`;
      text += `📌 *الحالة:* ${statusObj.label}\n`;
      text += `──────────────────\n`;
    });
  }

  const buttons = [];
  buttons.push([
    { text: '⏳ قيد الانتظار', callback_data: 'nav_orders_pending' },
    { text: '🚚 المشحونة', callback_data: 'nav_orders_shipped' },
    { text: '📋 الكل', callback_data: 'nav_orders_all' },
  ]);
  buttons.push([{ text: '🔙 القائمة الرئيسية', callback_data: 'nav_menu' }]);

  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
  });
}

async function sendStoreStats(chatId) {
  const products = getProducts();
  const orders = await getAllOrdersCombined();

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const pendingOrders = orders.filter((o) => !o.status || o.status === 'pending').length;
  const processingOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length;
  const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'completed').length;

  const text =
    `📊 *إحصائيات وتقارير متجر ROMA*\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🏷️ *إجمالي المنتجات:* ${products.length} منتج\n` +
    `📦 *إجمالي الطلبات المسجلة:* ${orders.length} طلب\n` +
    `💰 *إجمالي المبيعات:* ${totalRevenue.toLocaleString('ar-EG')} ج.م\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⏳ *طلبات قيد الانتظار:* ${pendingOrders}\n` +
    `🛠️ *طلبات مؤكدة:* ${processingOrders}\n` +
    `🚚 *طلبات قيد الشحن:* ${shippedOrders}\n` +
    `✨ *طلبات تم تسليمها:* ${completedOrders}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🌐 *الموقع المباشر:* https://roma-eg.my`;

  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}

// Handle Automatic Import from Amazon
async function handleAmazonImport(chatId, userId, rawUrl) {
  sessions.delete(userId);

  // Send initial waiting notification
  await tg('sendMessage', {
    chat_id: chatId,
    text: '⏳ *جاري سحب بيانات المنتج من أمازون وتحميل الصور بجودة فائقة...*\nيرجى الانتظار بضع ثوانٍ.',
    parse_mode: 'Markdown',
  });

  try {
    const res = await scrapeAmazonProduct(rawUrl);
    if (!res.ok || !res.data) {
      return tg('sendMessage', {
        chat_id: chatId,
        text: `❌ *تعذر سحب بيانات المنتج من أمازون:*\n${res.error || 'حدث خطأ غير متوقع'}\n\nيرجى التأكد من أن الرابط لصفحة منتج صحيحة على أمازون.`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 إعادة المحاولة برابط آخر', callback_data: 'nav_amazon_prod' }],
            [{ text: '🔙 القائمة الرئيسية', callback_data: 'nav_menu' }],
          ],
        },
      });
    }

    const data = res.data;

    // Download high-resolution images locally
    const localImages = await downloadAmazonImages(data.images, UPLOADS_DIR, DIST_UPLOADS_DIR);
    const mainImage = localImages[0] || (data.images && data.images[0]) || '/uploads/default.jpg';
    const additionalImages = localImages.slice(1);

    const timestamp = Date.now();
    const newProduct = {
      id: timestamp,
      nameAr: data.title,
      slug: `prod-${timestamp}`,
      descriptionAr: data.description,
      price: data.price,
      compareAtPrice: data.compareAtPrice || Math.round(data.price * 1.25),
      category: data.category,
      imageUrl: mainImage,
      additionalImages: additionalImages,
      rating: 5.0,
      reviewCount: 1,
      badge: 'جديد',
      stock: 50,
      variants: [
        { id: 1, nameAr: 'الحجم القياسي', hex: '#D4A5A5', sku: `RM-${timestamp}`, stock: 50 },
      ],
    };

    // Save locally and trigger git auto-push
    const products = getProducts();
    const normTitle = (newProduct.nameAr || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const existingIndex = products.findIndex((p) => (p.nameAr || '').trim().replace(/\s+/g, ' ').toLowerCase() === normTitle);

    if (existingIndex !== -1) {
      products[existingIndex] = {
        ...products[existingIndex],
        ...newProduct,
        id: products[existingIndex].id,
      };
      saveProducts(products, `Auto-update Amazon product: ${newProduct.nameAr}`);
    } else {
      products.unshift(newProduct);
      saveProducts(products, `Auto-import Amazon product: ${newProduct.nameAr}`);
    }

    // Insert into Supabase database
    try {
      await supabase.from('products').insert({
        name_ar: newProduct.nameAr,
        name_en: newProduct.nameAr,
        description_ar: newProduct.descriptionAr,
        description_en: newProduct.descriptionAr,
        price: newProduct.price,
        discount_price: newProduct.price,
        stock: 50,
        images: [mainImage, ...additionalImages],
        is_featured: true,
        badge_ar: 'جديد',
      });
    } catch (err) {
      console.warn('Supabase Amazon product insert note:', err?.message);
    }

    // Compose rich summary
    const descSnippet = newProduct.descriptionAr.length > 350
      ? newProduct.descriptionAr.slice(0, 347) + '...'
      : newProduct.descriptionAr;

    const caption =
      `🎉 *تم سحب ونشر المنتج من أمازون بنجاح!*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 *الاسم بالكامل:*\n${newProduct.nameAr}\n\n` +
      `🏷️ *التصنيف / الفئة:* *${newProduct.category}*\n` +
      `💰 *السعر:* *${newProduct.price} ج.م* (قبل الخصم: ~${newProduct.compareAtPrice} ج.م)\n` +
      `📊 *المخزون:* 50 قطعة\n` +
      `📸 *معرض الصور:* تم حفظ *${1 + additionalImages.length}* صور فائقة الدقة (HD)\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📝 *الوصف والمميزات:*\n${descSnippet}\n\n` +
      `🚀 *تم النشر والتحديث فوراً في المتجر المباشر!*`;

    const replyMarkup = {
      inline_keyboard: [
        [{ text: '🛍️ معاينة في المتجر المباشر', url: 'https://roma-eg.my/shop' }],
        [
          { text: '✏️ تعديل السعر', callback_data: `edit_price_${newProduct.id}` },
          { text: '📊 تعديل المخزون', callback_data: `edit_stock_${newProduct.id}` },
        ],
        [{ text: '📦 سحب منتج آخر من أمازون', callback_data: 'nav_amazon_prod' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 'nav_menu' }],
      ],
    };

    // Try sending with photo first
    let photoSent = false;
    const photoUrl = (data.images && data.images[0]) || (mainImage.startsWith('http') ? mainImage : `https://roma-eg.my${mainImage}`);
    if (photoUrl && photoUrl.startsWith('http')) {
      const photoRes = await tg('sendPhoto', {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup,
      });
      if (photoRes && photoRes.ok) {
        photoSent = true;
      }
    }

    if (!photoSent) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: caption,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup,
      });
    }
  } catch (err) {
    console.error('handleAmazonImport error:', err);
    return tg('sendMessage', {
      chat_id: chatId,
      text: `❌ حدث خطأ أثناء معالجة رابط أمازون: ${err.message}`,
      reply_markup: getMainKeyboard(),
    });
  }
}

// Finalize Product Creation
async function finalizeProduct(chatId, userId, session) {
  const draft = session.draft || {};
  sessions.delete(userId);

  const timestamp = Date.now();
  const allImages = Array.isArray(draft.images) && draft.images.length > 0
    ? draft.images
    : [draft.imageUrl || 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85'];

  const mainImage = allImages[0];
  const additionalImages = allImages.slice(1);

  const newProduct = {
    id: timestamp,
    nameAr: draft.nameAr || 'منتج جديد',
    slug: `prod-${timestamp}`,
    descriptionAr: draft.descriptionAr || 'مستحضر فاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة.',
    price: draft.price || 150,
    compareAtPrice: Math.round((draft.price || 150) * 1.25),
    category: draft.category || 'العناية بالشعر (Hair Care)',
    imageUrl: mainImage,
    additionalImages: additionalImages,
    rating: 5.0,
    reviewCount: 1,
    badge: 'جديد',
    stock: 50,
    variants: [
      { id: 1, nameAr: 'الحجم القياسي', hex: '#D4A5A5', sku: `RM-${timestamp}`, stock: 50 },
    ],
  };

  const products = getProducts();
  const normTitle = (newProduct.nameAr || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const existingIndex = products.findIndex((p) => (p.nameAr || '').trim().replace(/\s+/g, ' ').toLowerCase() === normTitle);

  if (existingIndex !== -1) {
    products[existingIndex] = {
      ...products[existingIndex],
      ...newProduct,
      id: products[existingIndex].id,
    };
    saveProducts(products, `Update product: ${newProduct.nameAr}`);
  } else {
    products.unshift(newProduct);
    saveProducts(products, `Add product ${newProduct.nameAr} with ${allImages.length} images`);
  }

  // Also insert into Supabase products table
  try {
    await supabase.from('products').insert({
      name_ar: newProduct.nameAr,
      name_en: newProduct.nameAr,
      description_ar: newProduct.descriptionAr,
      description_en: newProduct.descriptionAr,
      price: newProduct.price,
      discount_price: newProduct.price,
      stock: 50,
      images: allImages,
      is_featured: true,
      badge_ar: 'جديد',
    });
  } catch (err) {
    console.warn('Supabase product insert note:', err?.message);
  }

  return tg('sendMessage', {
    chat_id: chatId,
    text:
      `🎉 *تمت إضافة المنتج بنجاح ونشره في متجر ROMA!*\n\n` +
      `📦 *الاسم:* ${newProduct.nameAr}\n` +
      `🏷️ *التصنيف:* ${newProduct.category}\n` +
      `💰 *السعر:* ${newProduct.price} ج.م\n` +
      `📊 *المخزون:* 50 قطعة\n` +
      `📸 *معرض الصور:* تم حفظ *${allImages.length}* ${allImages.length === 1 ? 'صورة' : 'صور'} للمنتج\n` +
      `📝 *الوصف:* ${newProduct.descriptionAr}\n\n` +
      `🚀 *تم النشر والتحديث فوراً:* يظهر المنتج الآن في المتجر: https://roma-eg.my/shop`,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'معاينة في المتجر 🛍️', url: 'https://roma-eg.my/shop' }],
        [{ text: '➕ إضافة منتج آخر', callback_data: 'nav_add_prod' }],
        [{ text: '📋 عرض كل المنتجات', callback_data: 'nav_list_prod' }],
      ],
    },
  });
}

// ----------------- Fallback Order Watcher & Long Polling Loop -----------------

const sentWhatsAppStatusKeys = new Set();

async function pollOrdersFallbackRoutine() {
  try {
    const sbClient = await getAuthenticatedSupabase();
    const { data: recentOrders, error } = await sbClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !Array.isArray(recentOrders)) return;

    let orders = getOrders();
    let ordersModified = false;

    for (const row of recentOrders) {
      if (!row || !row.status || row.status === 'cart_draft' || String(row.order_number || '').startsWith('CART-')) continue;
      const cleanOrderId = String(row.order_number || row.id || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
      const statusKey = `${cleanOrderId}_${row.status}`;

      // Sync local orders.json
      const existingIdx = orders.findIndex(o => {
        const oClean = String(o.orderId || o.orderNumber || '').replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();
        return oClean === cleanOrderId;
      });
      if (existingIdx !== -1) {
        if (orders[existingIdx].status !== row.status) {
          orders[existingIdx].status = row.status;
          orders[existingIdx].updatedAt = row.updated_at || new Date().toISOString();
          ordersModified = true;
        }
      } else {
        orders.unshift({
          orderId: cleanOrderId,
          orderNumber: row.order_number || `ROMA-${cleanOrderId}`,
          customerName: row.customer_name || row.shipping_details?.fullName || 'عميلة المتجر',
          customerPhone: row.phone || row.shipping_details?.phone || 'غير مسجل',
          shippingAddress: row.shipping_address || row.shipping_details?.fullAddress || '',
          totalAmount: row.total_amount,
          status: row.status,
          items: Array.isArray(row.items) ? row.items : [],
          createdAt: row.created_at || new Date().toISOString(),
        });
        ordersModified = true;
      }

      // Check if automated WhatsApp should be sent
      if (['confirmed', 'shipped', 'delivered', 'cancelled'].includes(row.status)) {
        if (!sentWhatsAppStatusKeys.has(statusKey)) {
          sentWhatsAppStatusKeys.add(statusKey);
          const targetPhone = row.phone || row.shipping_details?.phone;
          if (targetPhone && targetPhone !== 'غير مسجل') {
            const orderObj = {
              orderId: cleanOrderId,
              orderNumber: row.order_number || `ROMA-${cleanOrderId}`,
              customerName: row.customer_name || row.shipping_details?.fullName || 'عميلة المتجر',
              customerPhone: targetPhone,
              shippingAddress: row.shipping_address || row.shipping_details?.fullAddress || '',
              totalAmount: row.total_amount,
              status: row.status,
              items: Array.isArray(row.items) ? row.items : [],
            };
            try {
              if (row.status === 'confirmed') {
                console.log(`[WHATSAPP AUTO] Order ${cleanOrderId} confirmed -> sending WhatsApp to ${targetPhone}...`);
                await sendOrderConfirmationWhatsApp(orderObj);
              } else {
                console.log(`[WHATSAPP AUTO] Order ${cleanOrderId} status ${row.status} -> sending WhatsApp to ${targetPhone}...`);
                await sendShippingUpdateWhatsApp(orderObj, row.status);
              }
            } catch (err) {
              console.warn('[WHATSAPP AUTO] Message send notice:', err?.message);
            }
          }
        }
      }
    }

    if (ordersModified) {
      saveOrders(orders);
    }
  } catch (_) {}
}

let lastUpdateId = 0;
async function poll() {
  // Check if webhook is active
  try {
    const infoRes = await fetch(`${BASE_URL}/getWebhookInfo`);
    const infoData = await infoRes.json();
    if (infoData.ok && infoData.result?.url) {
      console.log(`⚡ Telegram Webhook is active: ${infoData.result.url}`);
      console.log('🤖 Bot is running in Hybrid Daemon Mode: Supabase Realtime + WhatsApp Automations + Orders Watcher + Abandoned Cart Scheduler!');
      while (true) {
        await pollOrdersFallbackRoutine();
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  } catch (_) {}

  console.log('🤖 Telegram Bot is actively listening via Long Polling...');

  while (true) {
    try {
      await pollOrdersFallbackRoutine();
      const res = await fetch(`${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`, {
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          try {
            await handleUpdate(update);
          } catch (updateErr) {
            console.error('Error handling update:', updateErr);
          }
        }
      } else if (!data.ok) {
        if (data.error_code === 409) {
          console.warn(`⚠️ 409 Conflict: ${data.description}`);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (err) {
      if (err.name !== 'TimeoutError') {
        console.warn('Telegram polling retry:', err?.message || err);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

console.log('🤖 Telegram Bot @romaupbot is RUNNING with Realtime Order Tracking & Stock Management!');

// Start Realtime listener, WhatsApp Bridge & Abandoned Cart Interval (every 60s for 5-min carts)
initSupabaseRealtime();
initWhatsApp();
setInterval(checkAbandonedCartsRoutine, 60 * 1000); // Check every 1 minute

const startupText =
  `🟢 *تم تشغيل نظام إدارة متجر Roma المتكامل بنجاح!*\n\n` +
  `⚡ مفعل مع:\n` +
  `• 📦 سحب ونشر المنتجات تلقائياً عبر روابط أمازون بنقرة واحدة\n` +
  `• 📡 الاستماع اللحظي للطلبات الجديدة عبر Supabase Realtime\n` +
  `• 🔘 أزرار التحديث الفوري: تأكيد، شحن، تسليم، إلغاء\n` +
  `• 🛒 استعادة السلات المتروكة بكوبونات خصم مؤتمتة\n` +
  `• 🏷️ إضافة وتعديل المنتجات والمخزون\n\n` +
  `أرسل /menu أو /start لفتح لوحة التحكم، أو أرسل رابط أمازون مباشرة!`;

for (const adminId of getKnownAdmins()) {
  tg('sendMessage', {
    chat_id: adminId,
    text: startupText,
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}

poll();
