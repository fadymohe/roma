import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8358497211:AAF5Tr2e3VHXSt5K1BEvxqa-8bgIaHj-nwA';
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

// Helper to call Telegram API via native fetch
async function tg(method, body = {}) {
  try {
    const res = await fetch(`${BASE_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API error on ${method}:`, err.message);
    return { ok: false, error: err.message };
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
    const { data, error } = await supabase
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
        { text: '➕ إضافة منتج جديد', callback_data: 'nav_add_prod' },
        { text: '🏷️ إدارة المنتجات والمخزون', callback_data: 'nav_list_prod' },
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
  const paymentMethod = order.payment_method || 'الدفع عند الاستلام (COD)';
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
        console.log('⚡ Realtime Order INSERT detected:', payload.new?.id);
        try {
          await sendNewOrderNotification(payload.new);
        } catch (err) {
          console.error('Realtime notification error:', err);
        }
      }
    )
    .subscribe((status) => {
      console.log(`⚡ Supabase Realtime Subscription: ${status}`);
    });
}

// ----------------- Abandoned Cart Recovery Runner -----------------

async function checkAbandonedCartsRoutine() {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: abandonedCarts, error } = await supabase
      .from('carts')
      .select('id, user_id, session_id, last_activity_at, profiles(full_name, phone)')
      .eq('status', 'active')
      .lt('last_activity_at', twoHoursAgo)
      .is('recovery_email_sent_at', null);

    if (!error && Array.isArray(abandonedCarts) && abandonedCarts.length > 0) {
      console.log(`🛒 Found ${abandonedCarts.length} abandoned carts to recover.`);
      for (const cart of abandonedCarts) {
        const coupon = 'COMEBACK15';
        await supabase
          .from('carts')
          .update({
            status: 'abandoned',
            recovery_email_sent_at: new Date().toISOString(),
            coupon_code: coupon,
          })
          .eq('id', cart.id);

        const customerName = cart.profiles?.full_name || 'عميلة المتجر';
        const phone = cart.profiles?.phone || 'غير مسجل';
        const recoveryUrl = `https://roma-eg.my/cart?recovery_id=${cart.id}&coupon=${coupon}`;

        const msg =
          `🛒 *تنبيه سلة مهجورة (Abandoned Cart)*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `👤 *العميلة:* ${customerName}\n` +
          `📞 *الهاتف:* \`${phone}\`\n` +
          `🕒 *سلة متروكة منذ أكثر من ساعتين*\n` +
          `🎟️ *تم إنشاء كود استعادة:* \`${coupon}\` (-15%)\n` +
          `🔗 [رابط استعادة السلة](${recoveryUrl})`;

        tg('sendMessage', {
          chat_id: ADMIN_CHAT_ID,
          text: msg,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'واتساب العميلة 💬', url: `https://wa.me/201012345678?text=${encodeURIComponent(`مرحباً أستاذ/ة ${customerName}، نهديكِ كود خصم 15% إضافي ${coupon} لإكمال سلتكِ بمتجر روما:`)}` },
              ],
            ],
          },
        });
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
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return sendProductsList(chatId);
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
      const session = sessions.get(userId);
      if (session && session.step === 'CATEGORY') {
        session.draft.category = category;
        session.step = 'PRICE';
        await tg('answerCallbackQuery', { callback_query_id: cb.id });
        return tg('sendMessage', {
          chat_id: chatId,
          text: `✅ تم اختيار التصنيف: *${category}*\n\nأرسل الآن *سعر المنتج* بالجنيه المصري (مثال: \`245\`):`,
          parse_mode: 'Markdown',
        });
      }
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
    if (data.startsWith('accept_')) {
      actionData = `ord_status_confirmed_${data.replace('accept_', '')}`;
    } else if (data.startsWith('cancel_')) {
      actionData = `ord_status_cancelled_${data.replace('cancel_', '')}`;
    }

    // =========================================================================
    // 6. ONE-TAP INLINE STATUS UPDATES (confirmed, shipped, delivered, cancelled)
    // =========================================================================
    if (actionData.startsWith('ord_status_')) {
      const parts = actionData.replace('ord_status_', '').split('_');
      const newStatusKey = parts[0];
      const orderId = parts.slice(1).join('_');

      let orders = getOrders();
      let order = orders.find((o) => String(o.orderId) === String(orderId) || String(o.orderNumber) === String(orderId));

      const statusObj = STATUS_MAP[newStatusKey] || { label: newStatusKey };

      if (order) {
        order.status = newStatusKey;
        order.updatedAt = new Date().toISOString();
      } else {
        order = {
          orderId,
          status: newStatusKey,
          updatedAt: new Date().toISOString(),
          customerName: 'عميلة المتجر',
        };
        orders.unshift(order);
      }
      saveOrders(orders);

      // Update Supabase Database record
      try {
        await supabase
          .from('orders')
          .update({ status: newStatusKey, updated_at: new Date().toISOString() })
          .or(`id.eq.${orderId},order_number.eq.${orderId}`);
      } catch (err) {
        console.warn('Supabase status update error:', err?.message);
      }

      await tg('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: `تم تحديث الحالة إلى: ${statusObj.label}`,
      });

      // Update message text or caption dynamically
      const updateNotice = `\n\n📌 *تحديث الحالة:* ${statusObj.label}\n🕒 *التوقيت:* ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;

      const newKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ تم التأكيد', callback_data: `ord_status_confirmed_${orderId}` },
            { text: '🚚 قيد الشحن', callback_data: `ord_status_shipped_${orderId}` },
          ],
          [
            { text: '✨ تم التسليم', callback_data: `ord_status_delivered_${orderId}` },
            { text: '❌ إلغاء الطلب', callback_data: `ord_status_cancelled_${orderId}` },
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
          caption: (cb.message.caption || '') + updateNotice,
          parse_mode: 'Markdown',
          reply_markup: newKeyboard,
        });
      } else {
        await tg('editMessageText', {
          chat_id: chatId,
          message_id: msgId,
          text: (cb.message.text || '') + updateNotice,
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

    if (text === '/start' || text === '/menu') {
      sessions.delete(userId);
      return tg('sendMessage', {
        chat_id: chatId,
        text:
          `🌿 *أهلاً بك في نظام إدارة متجر Roma Store الذكي!*\n\n` +
          `المتجر مرتبط ومفعل بالكامل على [roma-eg.my](https://roma-eg.my).\n\n` +
          `🛠️ يمكنك إضافة وتعديل المنتجات والمخزون، وتأكيد وشحن الطلبات واستعادة السلات المتروكة:`,
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

    if (text === '/add_product' || text === '/new_product') {
      sessions.set(userId, { step: 'NAME', draft: {} });
      return tg('sendMessage', {
        chat_id: chatId,
        text: '🌱 *إضافة منتج جديد*\n\nالرجاء إرسال *اسم المنتج* (مثال: سيروم النضارة الفائق):',
        parse_mode: 'Markdown',
      });
    }

    if (text === '/products') {
      return sendProductsList(chatId);
    }

    if (text === '/orders') {
      return sendOrdersList(chatId, 'all');
    }

    if (text === '/stats') {
      return sendStoreStats(chatId);
    }

    // Step machine for adding or editing
    const session = sessions.get(userId);
    if (session) {
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
          text: `📦 اسم المنتج: *${text}*\n\nاختر *تصنيف المنتج* من الأزرار أدناه:`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'الوجه (Face)', callback_data: 'cat_الوجه (Face)' },
                { text: 'سيروم (Serum)', callback_data: 'cat_سيروم (Serum)' },
              ],
              [
                { text: 'مرطبات (Moisturizers)', callback_data: 'cat_مرطبات (Moisturizers)' },
                { text: 'الشفاه (Lips)', callback_data: 'cat_الشفاه (Lips)' },
              ],
              [
                { text: 'إكسسوارات نسائية', callback_data: 'cat_إكسسوارات (Accessories)' },
                { text: 'العناية بالبشرة', callback_data: 'cat_العناية بالبشرة (Skincare)' },
              ],
            ],
          },
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
        session.step = 'PHOTO';
        return tg('sendMessage', {
          chat_id: chatId,
          text: '📷 رائع جداً! أرسل الآن *صورة المنتج* (من الكاميرا أو المعرض)، أو أرسل رابط صورة مباشر:',
          parse_mode: 'Markdown',
        });
      }

      // Photo as URL text
      if (session.step === 'PHOTO') {
        const imageUrl = text.startsWith('http')
          ? text
          : 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85';
        session.draft.imageUrl = imageUrl;
        return finalizeProduct(chatId, userId, session);
      }
    }
  }

  // 3. Photo upload in wizard
  if (update.message?.photo) {
    const userId = update.message.from.id;
    const chatId = update.message.chat.id;
    const session = sessions.get(userId);

    if (session && session.step === 'PHOTO') {
      const photos = update.message.photo;
      const best = photos[photos.length - 1];
      const localUrl = await downloadTelegramPhoto(best.file_id);
      session.draft.imageUrl = localUrl || 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85';
      return finalizeProduct(chatId, userId, session);
    }
  }
}

// ----------------- Product & Order Renderers -----------------

async function sendProductsList(chatId) {
  const products = getProducts();
  if (products.length === 0) {
    return tg('sendMessage', {
      chat_id: chatId,
      text: 'لا توجد منتجات مسجلة في المتجر حالياً.',
      reply_markup: getMainKeyboard(),
    });
  }

  const buttons = [];
  products.slice(0, 15).forEach((p) => {
    buttons.push([
      { text: `📦 ${p.nameAr} (${p.price} ج.م - ${p.stock ?? 50} ق)`, callback_data: `edit_price_${p.id}` },
    ]);
    buttons.push([
      { text: `✏️ السعر`, callback_data: `edit_price_${p.id}` },
      { text: `📊 المخزون`, callback_data: `edit_stock_${p.id}` },
      { text: `🗑️ حذف`, callback_data: `del_prod_${p.id}` },
    ]);
  });

  buttons.push([{ text: '➕ إضافة منتج جديد', callback_data: 'nav_add_prod' }]);
  buttons.push([{ text: '🔙 القائمة الرئيسية', callback_data: 'nav_menu' }]);

  return tg('sendMessage', {
    chat_id: chatId,
    text: `🏷️ *قائمة منتجات ومخزون متجر Roma (${products.length} منتج)*:\nاختر إجراء لتعديل السعر أو الكمية:`,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
  });
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

// Finalize Product Creation
async function finalizeProduct(chatId, userId, session) {
  const draft = session.draft;
  sessions.delete(userId);

  const timestamp = Date.now();
  const newProduct = {
    id: timestamp,
    nameAr: draft.nameAr,
    slug: `prod-${timestamp}`,
    descriptionAr: draft.descriptionAr,
    price: draft.price,
    compareAtPrice: Math.round(draft.price * 1.25),
    category: draft.category || 'الوجه (Face)',
    imageUrl: draft.imageUrl,
    rating: 5.0,
    reviewCount: 1,
    badge: 'جديد',
    stock: 50,
    variants: [
      { id: 1, nameAr: 'الحجم القياسي', hex: '#D4A5A5', sku: `RM-${timestamp}`, stock: 50 },
    ],
  };

  const products = getProducts();
  products.unshift(newProduct);
  saveProducts(products, `Add product ${newProduct.nameAr}`);

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
      images: [newProduct.imageUrl],
      is_featured: true,
      badge_ar: 'جديد',
    });
  } catch (err) {
    console.warn('Supabase product insert note:', err?.message);
  }

  return tg('sendMessage', {
    chat_id: chatId,
    text:
      `🎉 *تمت إضافة المنتج بنجاح ونشره في متجر ROMA!* \n\n` +
      `📦 *الاسم:* ${newProduct.nameAr}\n` +
      `🏷️ *التصنيف:* ${newProduct.category}\n` +
      `💰 *السعر:* ${newProduct.price} ج.م\n` +
      `📊 *المخزون:* 50 قطعة\n` +
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

// ----------------- Long Polling Loop -----------------

let lastUpdateId = 0;
async function poll() {
  while (true) {
    try {
      const res = await fetch(`${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`, {
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          await handleUpdate(update);
        }
      }
    } catch (err) {
      if (err.name !== 'TimeoutError') {
        // quiet retry
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

console.log('🤖 Telegram Bot @romaupbot is RUNNING with Realtime Order Tracking & Stock Management!');

// Start Realtime listener & Abandoned Cart Interval
initSupabaseRealtime();
setInterval(checkAbandonedCartsRoutine, 15 * 60 * 1000); // Check every 15 mins

tg('sendMessage', {
  chat_id: ADMIN_CHAT_ID,
  text:
    `🟢 *تم تشغيل نظام إدارة متجر Roma المتكامل بنجاح!*\n\n` +
    `⚡ مفعل مع:\n` +
    `• 📡 الاستماع اللحظي للطلبات الجديدة عبر Supabase Realtime\n` +
    `• 🔘 أزرار التحديث الفوري: تأكيد، شحن، تسليم، إلغاء\n` +
    `• 🛒 استعادة السلات المتروكة بكوبونات خصم مؤتمتة\n` +
    `• 🏷️ إضافة وتعديل المنتجات والمخزون\n\n` +
    `أرسل /menu لفتح لوحة التحكم.`,
  parse_mode: 'Markdown',
  reply_markup: getMainKeyboard(),
});

poll();
