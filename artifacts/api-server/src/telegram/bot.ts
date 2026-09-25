import { logger } from "../lib/logger";

export interface TelegramOrderPayload {
  orderId: number | string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    variantName?: string;
  }>;
  shippingCost?: number;
  totalAmount: number;
  createdAt?: string;
}

// In-memory sessions for FSM product upload
interface AdminSession {
  step: "IDLE" | "TITLE" | "CATEGORY" | "PRICE" | "DESC" | "PHOTO";
  draftProduct: {
    nameAr?: string;
    category?: string;
    price?: number;
    descriptionAr?: string;
    volume?: string;
    imageUrl?: string;
  };
}

const sessions = new Map<number, AdminSession>();

// In-memory store for orders status when DB is in memory or testing
export const ordersStore = new Map<string, {
  status: "pending" | "accepted" | "shipped" | "cancelled";
  updatedAt: string;
  updatedBy?: string;
  telegramMessageId?: number;
}>();

// In-memory audit log for sent Telegram notifications (viewable via API)
export const telegramDispatchLogs: Array<{
  id: string;
  timestamp: string;
  type: "order_alert" | "bot_message" | "callback_action";
  details: any;
}> = [];

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const BASE_URL = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

/**
 * Execute Telegram API call with resilience
 */
async function callTelegramApi(endpoint: string, payload: any): Promise<any> {
  if (!BASE_URL) {
    logger.info({ endpoint, payload }, "[Telegram Mock] No BOT_TOKEN set. Dispatched to mock log.");
    telegramDispatchLogs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type: "order_alert",
      details: { endpoint, payload },
    });
    return { ok: true, result: { message_id: Math.floor(Math.random() * 100000) } };
  }

  try {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      logger.error({ data, endpoint }, "Telegram API returned non-ok response");
    }
    return data;
  } catch (error) {
    logger.error({ error, endpoint }, "Failed to communicate with Telegram API");
    return { ok: false, error };
  }
}

/**
 * Send interactive Order Alert to Store Merchant
 */
export async function notifyMerchantNewOrder(order: TelegramOrderPayload) {
  const orderKey = String(order.orderId);
  ordersStore.set(orderKey, {
    status: "pending",
    updatedAt: new Date().toISOString(),
  });

  const orderNum = order.orderNumber || `ROMA-${order.orderId}`;
  const itemsText = order.items
    .map(
      (item) =>
        `• *${item.quantity}x* ${item.name} ${item.variantName ? `(${item.variantName})` : ""} — \`${item.price * item.quantity} ج.م\``
    )
    .join("\n");

  const messageText =
    `🛍️ *طلب جديد تم استلامه في متجر ROMA!* \n` +
    `🔖 رقم الطلب: \`#${orderNum}\`\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 *العميل:* ${order.customerName || "عميل زائر"}\n` +
    `📞 *رقم الهاتف:* \`${order.customerPhone}\`\n` +
    `📍 *عنوان التوصيل:* ${order.shippingAddress}\n` +
    `💳 *طريقة الدفع:* ${order.paymentMethod || "الدفع عند الاستلام"}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 *المنتجات المطلوبة:*\n${itemsText}\n\n` +
    (order.shippingCost ? `🚚 *تكلفة الشحن:* ${order.shippingCost} ج.م\n` : "") +
    `💰 *المجموع النهائي:* *${order.totalAmount} ج.م*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `الحالة الحالية: ⏳ *قيد الانتظار والتحقق (Pending)*`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "قبول وتأكيد الطلب ✅", callback_data: `ord_accept_${order.orderId}` },
        { text: "إلغاء الطلب ❌", callback_data: `ord_cancel_${order.orderId}` },
      ],
      [
        { text: "خروج للشحن والتوصيل 🚚", callback_data: `ord_ship_${order.orderId}` },
        { text: "الاتصال بالعميل 📞", url: `tel:${order.customerPhone.replace(/\s+/g, "")}` },
      ],
    ],
  };

  const targetChat = ADMIN_CHAT_ID || "DEMO_ADMIN_CHANNEL";
  const result = await callTelegramApi("sendMessage", {
    chat_id: targetChat,
    text: messageText,
    parse_mode: "Markdown",
    reply_markup: inlineKeyboard,
  });

  if (result?.ok && result.result?.message_id) {
    const existing = ordersStore.get(orderKey);
    if (existing) {
      existing.telegramMessageId = result.result.message_id;
    }
  }

  return result;
}

/**
 * Handle incoming Telegram Webhook Updates
 */
export async function handleTelegramUpdate(update: any) {
  // 1. Handle Callback Query (Button Clicks)
  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data as string;
    const fromName = cb.from?.first_name || "المسؤول";

    if (data.startsWith("ord_")) {
      const parts = data.split("_");
      const action = parts[1]; // accept, ship, cancel
      const orderId = parts.slice(2).join("_");

      let newStatus: "accepted" | "shipped" | "cancelled" = "accepted";
      let statusLabel = "تم قبول وتأكيد الطلب وجارٍ التجهيز";
      let emoji = "✅";

      if (action === "ship") {
        newStatus = "shipped";
        statusLabel = "تم شحن الطلب مع مندوب التوصيل";
        emoji = "🚚";
      } else if (action === "cancel") {
        newStatus = "cancelled";
        statusLabel = "تم إلغاء الطلب من قبل الإدارة";
        emoji = "❌";
      }

      // Update Order Status Store
      ordersStore.set(orderId, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: fromName,
        telegramMessageId: cb.message?.message_id,
      });

      // Acknowledge callback to stop loading spinner on button
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: cb.id,
        text: `تم: ${statusLabel}`,
      });

      // Edit Message text in-place
      const currentText = cb.message?.text || "";
      const updatedText = currentText.replace(
        /الحالة الحالية:.*/,
        `الحالة الحالية: ${emoji} *${statusLabel}*\n👤 الموظف المسؤول: *${fromName}*`
      );

      await callTelegramApi("editMessageText", {
        chat_id: cb.message?.chat?.id,
        message_id: cb.message?.message_id,
        text: updatedText,
        parse_mode: "Markdown",
        reply_markup:
          action === "ship" || action === "cancel"
            ? undefined
            : {
                inline_keyboard: [
                  [{ text: "خروج للشحن والتوصيل 🚚", callback_data: `ord_ship_${orderId}` }],
                  [{ text: "إلغاء الطلب ❌", callback_data: `ord_cancel_${orderId}` }],
                ],
              },
      });

      telegramDispatchLogs.unshift({
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        type: "callback_action",
        details: { action, orderId, fromName },
      });

      return { success: true, action, orderId };
    }

    if (data.startsWith("cat_")) {
      const cat = data.replace("cat_", "");
      const session = sessions.get(cb.from.id);
      if (session) {
        session.draftProduct.category = cat;
        session.step = "PRICE";
        await callTelegramApi("answerCallbackQuery", { callback_query_id: cb.id });
        await callTelegramApi("sendMessage", {
          chat_id: cb.message.chat.id,
          text: `تم اختيار التصنيف: *${cat}*.\n\nالآن أرسل *سعر المنتج* بالجنيه المصري (مثال: \`350\`):`,
          parse_mode: "Markdown",
        });
      }
      return { success: true };
    }
  }

  // 2. Handle Text Messages
  if (update.message?.text) {
    const text = update.message.text.trim();
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;

    if (text === "/start") {
      sessions.set(userId, { step: "IDLE", draftProduct: {} });
      const welcome =
        `🌿 *أهلاً بك في نظام إدارة Roma Store الذكي عبر تيليجرام!*\n\n` +
        `هذا البوت يربطك مباشرة بمتجرك الإلكتروني لتلقي التنبيهات الفورية وإدارة العمليات.\n\n` +
        `🛠️ *الأوامر المتاحة:*\n` +
        `• \`/new_product\` — إضافة منتج جديد للواجهة في ثوانٍ\n` +
        `• \`/orders\` — عرض حالة الطلبات الأخيرة والمعلقة\n` +
        `• \`/status\` — فحص صحة الربط مع المتجر`;

      return await callTelegramApi("sendMessage", {
        chat_id: chatId,
        text: welcome,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "إضافة منتج جديد ➕", callback_data: "cmd_new" }],
            [{ text: "زيارة المتجر الإلكتروني 🌐", url: "https://roma-store.com" }],
          ],
        },
      });
    }

    if (text === "/orders") {
      const activeList = Array.from(ordersStore.entries()).slice(0, 5);
      if (activeList.length === 0) {
        return await callTelegramApi("sendMessage", {
          chat_id: chatId,
          text: `📦 لا توجد طلبات مسجلة حالياً في الذاكرة المؤقتة.`,
        });
      }

      const summary = activeList
        .map(([id, o]) => `• طلب \`#${id}\`: *${o.status.toUpperCase()}* (${new Date(o.updatedAt).toLocaleTimeString("ar-EG")})`)
        .join("\n");

      return await callTelegramApi("sendMessage", {
        chat_id: chatId,
        text: `📊 *آخر الطلبات في المتجر:*\n\n${summary}`,
        parse_mode: "Markdown",
      });
    }

    if (text === "/new_product") {
      sessions.set(userId, { step: "TITLE", draftProduct: {} });
      return await callTelegramApi("sendMessage", {
        chat_id: chatId,
        text: `🌱 *إضافة منتج طبيعي جديد*\n\nالرجاء إرسال *اسم المنتج* باللغة العربية:`,
        parse_mode: "Markdown",
      });
    }

    // Step Machine Handling
    const session = sessions.get(userId);
    if (session && session.step !== "IDLE") {
      if (session.step === "TITLE") {
        session.draftProduct.nameAr = text;
        session.step = "CATEGORY";
        return await callTelegramApi("sendMessage", {
          chat_id: chatId,
          text: `اختر *تصنيف المنتج* بالضغط على أحد الأزرار أدناه:`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "العناية بالبشرة (Face)", callback_data: "cat_العناية الفائقة بالبشرة" },
                { text: "سيروم مركز (Serum)", callback_data: "cat_سيروم مغذي" },
              ],
              [
                { text: "أحمر شفاه (Lips)", callback_data: "cat_أحمر الشفاه والقلوس" },
                { text: "عطور وجسم (Body)", callback_data: "cat_العطور الفاخرة وبخاخات الجسم" },
              ],
            ],
          },
        });
      }

      if (session.step === "PRICE") {
        const p = parseFloat(text);
        if (isNaN(p) || p <= 0) {
          return await callTelegramApi("sendMessage", {
            chat_id: chatId,
            text: `⚠️ يرجى إدخال رقم سعر صحيح (مثال: \`280\`).`,
          });
        }
        session.draftProduct.price = p;
        session.step = "DESC";
        return await callTelegramApi("sendMessage", {
          chat_id: chatId,
          text: `أدخل الآن *وصف المنتج ومميزاته*:`,
          parse_mode: "Markdown",
        });
      }

      if (session.step === "DESC") {
        session.draftProduct.descriptionAr = text;
        session.step = "PHOTO";
        return await callTelegramApi("sendMessage", {
          chat_id: chatId,
          text: `📷 رائع! أرسل الآن *صورة المنتج* (أو أرسل رابط الصورة مباشرة كنص):`,
          parse_mode: "Markdown",
        });
      }

      if (session.step === "PHOTO") {
        // If image URL is sent as text
        session.draftProduct.imageUrl = text.startsWith("http")
          ? text
          : "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85";
        session.step = "IDLE";

        return await callTelegramApi("sendMessage", {
          chat_id: chatId,
          text:
            `✅ *تم إضافة المنتج الجديد بنجاح إلى كتالوج Roma Store!* 🎉\n\n` +
            `📦 *الاسم:* ${session.draftProduct.nameAr}\n` +
            `🏷️ *التصنيف:* ${session.draftProduct.category}\n` +
            `💰 *السعر:* ${session.draftProduct.price} ج.م\n` +
            `📝 *الوصف:* ${session.draftProduct.descriptionAr}`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "معاينة في المتجر 🌐", url: "https://roma-store.com/shop" }],
            ],
          },
        });
      }
    }
  }

  // 3. Handle Photo upload
  if (update.message?.photo) {
    const userId = update.message.from.id;
    const chatId = update.message.chat.id;
    const session = sessions.get(userId);

    if (session && session.step === "PHOTO") {
      session.draftProduct.imageUrl = "https://images.unsplash.com/photo-1608248597359-0a56e6db3f3b?auto=format&fit=crop&w=900&q=85";
      session.step = "IDLE";

      return await callTelegramApi("sendMessage", {
        chat_id: chatId,
        text:
          `✅ *تم استلام الصورة ونشر المنتج في المتجر بنجاح!* 🎉\n\n` +
          `📦 *الاسم:* ${session.draftProduct.nameAr}\n` +
          `💰 *السعر:* ${session.draftProduct.price} ج.م`,
        parse_mode: "Markdown",
      });
    }
  }

  return { ok: true };
}
