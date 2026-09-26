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
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3JnYm12YnZxd3ppemJid3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODE0MTMsImV4cCI6MjEwNTk1NzQxM30.kd8bIzK5UzbWIPP4eCHhkflhaRLQ7C1AKb-RhDnvbhM';
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
        customerName: row.customer_name,
        customerPhone: row.phone,
        shippingAddress: row.shipping_address,
        totalAmount: row.total_amount,
        status: row.status || 'pending',
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

    // Also update dist/products.json if exists
    if (fs.existsSync(path.dirname(DIST_PRODUCTS_JSON_PATH))) {
      fs.writeFileSync(DIST_PRODUCTS_JSON_PATH, data, 'utf8');
    }

    // Touch root sync file so Vercel always recognizes changes in root
    const syncInfo = {
      lastSync: new Date().toISOString(),
      totalProducts: products.length,
      lastAction: actionDesc,
    };
    fs.writeFileSync(ROOT_SYNC_PATH, JSON.stringify(syncInfo, null, 2), 'utf8');

    // Update catalog-data.ts with latest products
    updateCatalogData(products);

    // Git commit & push for automatic Vercel deployment
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
    (err, stdout) => {
      if (err) {
        console.error('Git push error:', err.message);
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

    // Copy to dist uploads as well
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
        { text: '🏷️ إدارة المنتجات', callback_data: 'nav_list_prod' },
      ],
      [
        { text: '📦 إدارة الطلبات', callback_data: 'nav_orders_all' },
        { text: '📊 إحصائيات المتجر', callback_data: 'nav_stats' },
      ],
      [
        { text: '🌐 زيارة متجر Roma', url: 'https://roma-eg.my' },
      ],
    ],
  };
}

// Status labels & badges
const STATUS_MAP = {
  pending: { label: 'قيد الانتظار ⏳', badge: '⏳ جديد' },
  processing: { label: 'جاري التجهيز 🛠️', badge: '🛠️ بالتجهيز' },
  shipped: { label: 'تم الشحن 🚚', badge: '🚚 مشحون' },
  completed: { label: 'تم التسليم بنجاح ✅', badge: '✅ مكتمل' },
  cancelled: { label: 'ملغي ❌', badge: '❌ ملغي' },
};

// ----------------- Update & Interaction Handler -----------------

async function handleUpdate(update) {
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

    // Order status update
    if (data.startsWith('ord_status_')) {
      // Format: ord_status_<status>_<orderId>
      const parts = data.replace('ord_status_', '').split('_');
      const newStatusKey = parts[0];
      const orderId = parts.slice(1).join('_');

      let orders = getOrders();
      let order = orders.find((o) => String(o.orderId) === String(orderId));

      const statusObj = STATUS_MAP[newStatusKey] || { label: newStatusKey };

      if (order) {
        order.status = newStatusKey;
        order.updatedAt = new Date().toISOString();
      } else {
        order = {
          orderId,
          status: newStatusKey,
          updatedAt: new Date().toISOString(),
          customerName: 'عميل المتجر',
        };
        orders.unshift(order);
      }
      saveOrders(orders);

      // Also update Supabase
      try {
        await supabase.from('orders').update({ status: newStatusKey }).eq('id', orderId);
      } catch (err) {
        console.warn('Supabase status update error:', err?.message);
      }

      await tg('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: `تم تحديث الحالة: ${statusObj.label}`,
      });

      // Update message text if possible
      const originalText = cb.message.text || '';
      const updateNotice = `\n\n📌 *تحديث الحالة:* ${statusObj.label}\n🕒 *التاريخ:* ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;

      await tg('editMessageText', {
        chat_id: chatId,
        message_id: msgId,
        text: originalText + updateNotice,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'جاري التجهيز 🛠️', callback_data: `ord_status_processing_${orderId}` },
              { text: 'تم الشحن 🚚', callback_data: `ord_status_shipped_${orderId}` },
            ],
            [
              { text: 'تم التسليم ✅', callback_data: `ord_status_completed_${orderId}` },
              { text: 'إلغاء ❌', callback_data: `ord_status_cancelled_${orderId}` },
            ],
            [
              { text: '📋 عرض كل الطلبات', callback_data: 'nav_orders_all' },
            ],
          ],
        },
      });

      return;
    }

    // Backward compatibility for ord_ok_
    if (data.startsWith('ord_ok_')) {
      const orderId = data.replace('ord_ok_', '');
      let orders = getOrders();
      let order = orders.find((o) => String(o.orderId) === String(orderId));
      if (order) {
        order.status = 'processing';
        saveOrders(orders);
      }
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'تم قبول الطلب ✅' });
      return tg('sendMessage', {
        chat_id: chatId,
        text: `✅ تم قبول الطلب #${orderId} وجارٍ تجهيزه للشحن!`,
      });
    }

    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    return;
  }

  // 2. Text message handling
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
          `🛠️ يمكنك إدارة المنتجات وتعديل أسعارها وحذفها، ومتابعة الطلبات وتحديث حالاتها مباشرة من هنا:`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
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
                { text: 'العطور والجسم (Body)', callback_data: 'cat_العطور والجسم (Body)' },
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
            ? `مستحضر طبيعي مميز وفاخر من متجر روما، مصمم بتركيبة فريدة وآمنة للعناية الفائقة ومنح بشرتك لمسة من النقاء والإشراقة الدائمة.`
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

// ----------------- View Renderers -----------------

async function sendProductsList(chatId) {
  const products = getProducts();
  if (products.length === 0) {
    return tg('sendMessage', {
      chat_id: chatId,
      text: '📭 لا توجد منتجات مسجلة حالياً في المتجر.\n\nاستخدم الزر أدناه لإضافة أول منتج:',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ إضافة منتج جديد', callback_data: 'nav_add_prod' }],
        ],
      },
    });
  }

  let text = `📋 *قائمة منتجات المتجر (${products.length}):*\n\n`;
  const buttons = [];

  products.forEach((p, i) => {
    text += `${i + 1}. *${p.nameAr}*\n💰 السعر: *${p.price} ج.م* | 🏷️ التصنيف: ${p.category}\n\n`;
    buttons.push([
      { text: `✏️ تعديل السعر (#${i + 1})`, callback_data: `edit_price_${p.id}` },
      { text: `🗑️ حذف (#${i + 1})`, callback_data: `del_prod_${p.id}` },
    ]);
  });

  buttons.push([
    { text: '➕ إضافة منتج جديد', callback_data: 'nav_add_prod' },
    { text: '🔙 القائمة الرئيسية', callback_data: 'nav_menu' },
  ]);

  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons },
  });
}

async function sendOrdersList(chatId, filter = 'all') {
  const orders = await getAllOrdersCombined();

  let filtered = orders;
  if (filter !== 'all') {
    filtered = orders.filter((o) => o.status === filter);
  }

  const titleMap = {
    all: 'كل الطلبات',
    pending: 'الطلبات قيد الانتظار ⏳',
    processing: 'طلبات جاري تجهيزها 🛠️',
    shipped: 'طلبات تم شحنها 🚚',
    completed: 'طلبات مكتملة ✅',
  };

  if (filtered.length === 0) {
    return tg('sendMessage', {
      chat_id: chatId,
      text: `📭 لا توجد طلبات في قسم: *${titleMap[filter] || filter}*`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⏳ قيد الانتظار', callback_data: 'nav_orders_pending' },
            { text: '🛠️ بالتجهيز', callback_data: 'nav_orders_processing' },
            { text: '🚚 المشحونة', callback_data: 'nav_orders_shipped' },
          ],
          [
            { text: '📋 كل الطلبات', callback_data: 'nav_orders_all' },
            { text: '🔙 القائمة الرئيسية', callback_data: 'nav_menu' },
          ],
        ],
      },
    });
  }

  let text = `📦 *قائمة ${titleMap[filter] || filter} (${filtered.length}):*\n\n`;
  const buttons = [];

  filtered.slice(0, 10).forEach((ord, i) => {
    const status = STATUS_MAP[ord.status] || { label: ord.status || 'جديد' };
    text += `${i + 1}. *طلب #ROMA-${ord.orderId}*\n👤 العميل: ${ord.customerName || 'عميل المتجر'}\n📞 الهاتف: \`${ord.customerPhone || 'غير مسجل'}\`\n💰 الإجمالي: *${ord.totalAmount || 0} ج.م*\n📌 الحالة: *${status.label}*\n\n`;

    buttons.push([
      { text: `تجهيز 🛠️ (#${ord.orderId})`, callback_data: `ord_status_processing_${ord.orderId}` },
      { text: `شحن 🚚 (#${ord.orderId})`, callback_data: `ord_status_shipped_${ord.orderId}` },
      { text: `إكمال ✅`, callback_data: `ord_status_completed_${ord.orderId}` },
    ]);
  });

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
  const processingOrders = orders.filter((o) => o.status === 'processing').length;
  const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;

  const text =
    `📊 *إحصائيات وتقارير متجر ROMA*\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🏷️ *إجمالي المنتجات:* ${products.length} منتج\n` +
    `📦 *إجمالي الطلبات المسجلة:* ${orders.length} طلب\n` +
    `💰 *إجمالي المبيعات:* ${totalRevenue.toLocaleString('ar-EG')} ج.م\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⏳ *طلبات قيد الانتظار:* ${pendingOrders}\n` +
    `🛠️ *طلبات قيد التجهيز:* ${processingOrders}\n` +
    `🚚 *طلبات تم شحنها:* ${shippedOrders}\n` +
    `✅ *طلبات تم تسليمها:* ${completedOrders}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🌐 *الموقع المباشر:* https://roma-eg.my`;

  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}

// ----------------- Finalize Product Creation -----------------

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
    variants: [
      { id: 1, nameAr: 'الحجم القياسي', hex: '#76A080', sku: `RM-${timestamp}`, stock: 50 },
    ],
  };

  const products = getProducts();
  products.unshift(newProduct);
  saveProducts(products, `Add product ${newProduct.nameAr}`);

  return tg('sendMessage', {
    chat_id: chatId,
    text:
      `🎉 *تمت إضافة المنتج بنجاح ونشره في متجر ROMA!* \n\n` +
      `📦 *الاسم:* ${newProduct.nameAr}\n` +
      `🏷️ *التصنيف:* ${newProduct.category}\n` +
      `💰 *السعر:* ${newProduct.price} ج.م\n` +
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

console.log('🤖 Telegram Bot @romaupbot is RUNNING with full Product & Order Management!');
tg('sendMessage', {
  chat_id: ADMIN_CHAT_ID,
  text:
    `🟢 *تم تشغيل نظام إدارة متجر Roma بنجاح!*\n\n` +
    `تحكم بالكامل في:\n` +
    `• 🏷️ إضافة وتعديل وحذف المنتجات\n` +
    `• 📦 متابعة وتحديث حالات طلبات العملاء\n` +
    `• 📊 إحصائيات المبيعات والأرباح\n\n` +
    `أرسل /menu أو /start لفتح لوحة التحكم.`,
  parse_mode: 'Markdown',
  reply_markup: getMainKeyboard(),
});

poll();
