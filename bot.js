import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8358497211:AAF5Tr2e3VHXSt5K1BEvxqa-8bgIaHj-nwA';
const ADMIN_CHAT_ID = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '8940310160');
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const PRODUCTS_JSON_PATH = path.join(__dirname, 'artifacts', 'roma-store', 'public', 'products.json');
const DIST_PRODUCTS_JSON_PATH = path.join(__dirname, 'dist', 'products.json');
const UPLOADS_DIR = path.join(__dirname, 'artifacts', 'roma-store', 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory sessions
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

// Read products
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

// Save products
function saveProducts(products) {
  try {
    const data = JSON.stringify(products, null, 2);
    fs.writeFileSync(PRODUCTS_JSON_PATH, data, 'utf8');
    if (fs.existsSync(path.dirname(DIST_PRODUCTS_JSON_PATH))) {
      fs.writeFileSync(DIST_PRODUCTS_JSON_PATH, data, 'utf8');
    }
    // Update catalog-data.ts
    updateCatalogData(products);
    // Git push
    autoPush();
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
      content = content.replace(/export const PRODUCTS = \[[\s\S]*?\];/, `export const PRODUCTS = ${jsonStr};`);
      fs.writeFileSync(catalogPath, content, 'utf8');
    }
  } catch (e) {
    console.error('Error updating catalog-data.ts:', e);
  }
}

function autoPush() {
  exec('git add . && git commit -m "Add product from Telegram Bot" && git push origin main', { cwd: __dirname }, (err) => {
    if (!err) {
      console.log('🚀 Pushed changes to GitHub for Vercel deployment!');
    }
  });
}

// Download file from Telegram
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
    fs.writeFileSync(localPath, Buffer.from(arrayBuffer));

    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('Download photo error:', err);
    return null;
  }
}

// Message handler
async function handleUpdate(update) {
  // 1. Callback query
  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data;
    const userId = cb.from.id;
    const chatId = cb.message.chat.id;

    if (data === 'cmd_add') {
      sessions.set(userId, { step: 'NAME', draft: {} });
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      return tg('sendMessage', {
        chat_id: chatId,
        text: '🌱 *إضافة منتج جديد*\n\nالرجاء إرسال *اسم المنتج* (مثال: سيروم النضارة الفائق):',
        parse_mode: 'Markdown',
      });
    }

    if (data === 'cmd_list') {
      await tg('answerCallbackQuery', { callback_query_id: cb.id });
      const products = getProducts();
      if (products.length === 0) {
        return tg('sendMessage', {
          chat_id: chatId,
          text: '📭 لا توجد منتجات مسجلة حالياً في المتجر. استخدم /add_product لإضافة أول منتج!',
        });
      }
      let msg = `📋 *المنتجات المعروضة بالمتجر (${products.length}):*\n\n`;
      products.forEach((p, i) => {
        msg += `${i + 1}. *${p.nameAr}*\n💰 السعر: ${p.price} ج.م | 🏷️ التصنيف: ${p.category}\n\n`;
      });
      return tg('sendMessage', { chat_id: chatId, text: msg, parse_mode: 'Markdown' });
    }

    if (data.startsWith('cat_')) {
      const category = data.replace('cat_', '');
      const session = sessions.get(userId);
      if (session && session.step === 'CATEGORY') {
        session.draft.category = category;
        session.step = 'PRICE';
        await tg('answerCallbackQuery', { callback_query_id: cb.id });
        return tg('sendMessage', {
          chat_id: chatId,
          text: `✅ تم اختيار التصنيف: *${category}*\n\nأرسل الآن *سعر المنتج* بالجنيه المصري (أرقام فقط، مثال: \`180\`):`,
          parse_mode: 'Markdown',
        });
      }
    }

    if (data.startsWith('del_')) {
      const id = parseInt(data.replace('del_', ''), 10);
      let products = getProducts();
      const target = products.find((p) => p.id === id);
      products = products.filter((p) => p.id !== id);
      saveProducts(products);
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'تم الحذف' });
      return tg('sendMessage', {
        chat_id: chatId,
        text: `🗑️ تم حذف المنتج: *${target?.nameAr || id}* بنجاح من المتجر!`,
        parse_mode: 'Markdown',
      });
    }

    if (data.startsWith('ord_ok_')) {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'تم تأكيد الطلب ✅' });
      return tg('sendMessage', {
        chat_id: chatId,
        text: '✅ تم تأكيد الطلب وجارٍ التجهيز للشحن الفوري للعميل!',
      });
    }

    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    return;
  }

  // 2. Text message
  if (update.message?.text) {
    const text = update.message.text.trim();
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;

    if (text === '/start') {
      sessions.delete(userId);
      return tg('sendMessage', {
        chat_id: chatId,
        text:
          `🌿 *أهلاً بك في نظام إدارة Roma Store الذكي عبر تيليجرام!*\n\n` +
          `تم تفعيل البوت بنجاح وربطه بالمتجر [roma-eg.my](https://roma-eg.my).\n\n` +
          `🛠️ *الأوامر المتاحة:*\n` +
          `• /add_product — إضافة منتج جديد فوراً ➕\n` +
          `• /products — عرض وحذف المنتجات 📋\n` +
          `• /status — حالة المتجر والبوت 🟢`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'إضافة منتج جديد ➕', callback_data: 'cmd_add' }],
            [{ text: 'عرض قائمة المنتجات 📋', callback_data: 'cmd_list' }],
            [{ text: 'زيارة المتجر الإلكتروني 🌐', url: 'https://roma-eg.my' }],
          ],
        },
      });
    }

    if (text === '/add_product' || text === '/new_product') {
      sessions.set(userId, { step: 'NAME', draft: {} });
      return tg('sendMessage', {
        chat_id: chatId,
        text: '🌱 *إضافة منتج جديد*\n\nالرجاء إرسال *اسم المنتج* (مثال: كريم استعادة نضارة وترطيب الوجه):',
        parse_mode: 'Markdown',
      });
    }

    if (text === '/products') {
      const products = getProducts();
      if (products.length === 0) {
        return tg('sendMessage', {
          chat_id: chatId,
          text: '📭 لا توجد منتجات مسجلة حالياً.\n\nاستخدم الأمر /add_product لإضافة أول منتج!',
        });
      }
      let msg = `📋 *قائمة منتجات المتجر (${products.length}):*\n\n`;
      const buttons = [];
      products.forEach((p, i) => {
        msg += `${i + 1}. *${p.nameAr}*\n💰 السعر: ${p.price} ج.م | 🏷️ التصنيف: ${p.category}\n\n`;
        buttons.push([{ text: `🗑️ حذف: ${p.nameAr.slice(0, 22)}`, callback_data: `del_${p.id}` }]);
      });
      return tg('sendMessage', {
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons.slice(0, 10) },
      });
    }

    if (text === '/status') {
      const products = getProducts();
      return tg('sendMessage', {
        chat_id: chatId,
        text: `🟢 *حالة البوت والمتجر:*\n\n• البوت: يعمل بنشاط ✅\n• عدد المنتجات: ${products.length}\n• نطاق المتجر: https://roma-eg.my`,
        parse_mode: 'Markdown',
      });
    }

    // Step machine
    const session = sessions.get(userId);
    if (session) {
      if (session.step === 'NAME') {
        session.draft.nameAr = text;
        session.step = 'CATEGORY';
        return tg('sendMessage', {
          chat_id: chatId,
          text: 'اختر *تصنيف المنتج* بالضغط على أحد الأزرار أدناه:',
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
              ],
            ],
          },
        });
      }

      if (session.step === 'PRICE') {
        const p = parseFloat(text);
        if (isNaN(p) || p <= 0) {
          return tg('sendMessage', {
            chat_id: chatId,
            text: '⚠️ يرجى إدخال رقم سعر صحيح (مثال: `150`):',
          });
        }
        session.draft.price = p;
        session.step = 'DESC';
        return tg('sendMessage', {
          chat_id: chatId,
          text: '📝 أرسل الآن *وصف المنتج ومميزاته* (أو أرسل نقطة `.` لتخطي الوصف):',
          parse_mode: 'Markdown',
        });
      }

      if (session.step === 'DESC') {
        session.draft.descriptionAr = text === '.' ? 'مستحضر طبيعي فاخر للعناية الفائقة.' : text;
        session.step = 'PHOTO';
        return tg('sendMessage', {
          chat_id: chatId,
          text: '📷 رائع جداً! أرسل الآن *صورة المنتج* (أو أرسل رابط الصورة مباشرة كنص):',
          parse_mode: 'Markdown',
        });
      }

      if (session.step === 'PHOTO') {
        const imageUrl = text.startsWith('http')
          ? text
          : 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85';
        session.draft.imageUrl = imageUrl;
        return finalize(chatId, userId, session);
      }
    }
  }

  // 3. Photo upload
  if (update.message?.photo) {
    const userId = update.message.from.id;
    const chatId = update.message.chat.id;
    const session = sessions.get(userId);

    if (session && session.step === 'PHOTO') {
      const photos = update.message.photo;
      const best = photos[photos.length - 1];
      const localUrl = await downloadTelegramPhoto(best.file_id);
      session.draft.imageUrl = localUrl || 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85';
      return finalize(chatId, userId, session);
    }
  }
}

// Finalize product creation
async function finalize(chatId, userId, session) {
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
  saveProducts(products);

  return tg('sendMessage', {
    chat_id: chatId,
    text:
      `🎉 *تمت إضافة المنتج ونشره في متجر Roma بنجاح!* \n\n` +
      `📦 *الاسم:* ${newProduct.nameAr}\n` +
      `🏷️ *التصنيف:* ${newProduct.category}\n` +
      `💰 *السعر:* ${newProduct.price} ج.م\n` +
      `📝 *الوصف:* ${newProduct.descriptionAr}\n\n` +
      `🌐 سيظهر المنتج فوراً في واجهة المتجر: https://roma-eg.my/shop`,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'معاينة في المتجر 🛍️', url: 'https://roma-eg.my/shop' }],
        [{ text: 'إضافة منتج آخر ➕', callback_data: 'cmd_add' }],
      ],
    },
  });
}

// Long polling loop
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
      // Timeout is normal in long polling when there are no new messages
      if (err.name !== 'TimeoutError') {
        // quiet retry
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

console.log('🤖 Telegram Bot @romaupbot is RUNNING and listening for updates via Native Fetch!');
tg('sendMessage', {
  chat_id: ADMIN_CHAT_ID,
  text: '🟢 *بوت متجر Roma Store يعمل الآن بنجاح!* أرسل /add_product لإضافة أول منتج.',
  parse_mode: 'Markdown',
});

poll();
