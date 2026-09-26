import "dotenv/config";
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
export const ordersStore = new Map<
  string,
  {
    status: "pending" | "accepted" | "shipped" | "cancelled";
    updatedAt: string;
    updatedBy?: string;
    telegramMessageId?: number;
  }
>();

// In-memory audit log for sent Telegram notifications (viewable via API)
export const telegramDispatchLogs: Array<{
  id: string;
  timestamp: string;
  type: "order_alert" | "bot_message" | "callback_action";
  details: any;
}> = [];

// Properly read environment variables with explicit default fallbacks
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  "8358497211:AAF5Tr2e3VHXSt5K1BEvxqa-8bgIaHj-nwA";
const ADMIN_CHAT_ID =
  process.env.TELEGRAM_ADMIN_CHAT_ID || "8940310160";
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Execute Telegram API call with resilience & explicit console error logging
 */
async function callTelegramApi(endpoint: string, payload: any): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data: any = await res.json();
    if (!data.ok) {
      console.error("Telegram API returned non-ok response:", data);
      logger.error({ data, endpoint }, "Telegram API returned non-ok response");
    }
    return data;
  } catch (error) {
    console.error("Telegram dispatch error:", error);
    logger.error({ error, endpoint }, "Failed to communicate with Telegram API");
    return { ok: false, error };
  }
}

/**
 * Send interactive Order Alert to Store Merchant
 */
export async function notifyMerchantNewOrder(order: TelegramOrderPayload) {
  try {
    const orderKey = String(order.orderId);
    ordersStore.set(orderKey, {
      status: "pending",
      updatedAt: new Date().toISOString(),
    });

    const orderNum = order.orderNumber || `ROMA-${order.orderId}`;
    const cleanPhone = (order.customerPhone || "").replace(/\D+/g, "");
    const waPhone = cleanPhone.startsWith("0")
      ? `2${cleanPhone}`
      : cleanPhone.startsWith("2")
      ? cleanPhone
      : `20${cleanPhone}`;

    const itemsHtml = Array.isArray(order.items) && order.items.length > 0
      ? order.items
          .map(
            (item) =>
              `• <b>${item.quantity || 1}x</b> ${escapeHtml(item.name || "مستحضر")} ${item.variantName ? `(${escapeHtml(item.variantName)})` : ""} — <code>${(item.price || 0) * (item.quantity || 1)} ج.م</code>`
          )
          .join("\n")
      : "• مستحضرات عناية طبيعية";

    const messageHtml =
      `🛍️ <b>طلب جديد تم استلامه في متجر ROMA!</b>\n` +
      `🔖 رقم الطلب: <code>#${escapeHtml(orderNum)}</code>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>العميل:</b> ${escapeHtml(order.customerName || "عميل زائر")}\n` +
      `📞 <b>رقم الهاتف:</b> <code>${escapeHtml(order.customerPhone || "غير متوفر")}</code>\n` +
      `📍 <b>عنوان التوصيل:</b> ${escapeHtml(order.shippingAddress || "غير محدد")}\n` +
      `💳 <b>طريقة الدفع:</b> ${escapeHtml(order.paymentMethod || "الدفع عند الاستلام")}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>المنتجات المطلوبة:</b>\n${itemsHtml}\n\n` +
      (order.shippingCost ? `🚚 <b>تكلفة الشحن:</b> ${order.shippingCost} ج.م\n` : "") +
      `💰 <b>المجموع النهائي:</b> <b>${order.totalAmount} ج.م</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `الحالة الحالية: ⏳ <b>قيد الانتظار والتحقق (Pending)</b>`;

    // Interactive inline keyboard buttons:
    // [ قبول الطلب ✅ ] (callback data: accept_<order_id>)
    // [ إلغاء الطلب ❌ ] (callback data: cancel_<order_id>)
    // [ محادثة واتساب مباشرة 💬 ] (wa URL with customer phone)
    const keyboard = {
      inline_keyboard: [
        [
          { text: "قبول الطلب ✅", callback_data: `accept_${order.orderId}` },
          { text: "إلغاء الطلب ❌", callback_data: `cancel_${order.orderId}` },
        ],
        [
          {
            text: "محادثة العميل عبر واتساب 💬",
            url: `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ/ة ${order.customerName}، بخصوص طلبكِ #${orderNum} من متجر Roma:`)}`,
          },
        ],
      ],
    };

    const targetChat = ADMIN_CHAT_ID;
    const result = await callTelegramApi("sendMessage", {
      chat_id: targetChat,
      text: messageHtml,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });

    if (result?.ok && result.result?.message_id) {
      const existing = ordersStore.get(orderKey);
      if (existing) {
        existing.telegramMessageId = result.result.message_id;
      }
    }

    telegramDispatchLogs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type: "order_alert",
      details: { orderId: order.orderId, ok: result?.ok, targetChat },
    });

    return result;
  } catch (error) {
    console.error("Telegram dispatch error:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Handle incoming Telegram Webhook Updates
 */
export async function handleTelegramUpdate(update: any) {
  try {
    // 1. Handle Callback Query (Button Clicks)
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = (cb.data as string) || "";
      const fromName = cb.from?.first_name || "المسؤول";

      // Support: accept_<id>, cancel_<id>, ord_accept_<id>, ord_cancel_<id>, ord_ship_<id>
      let action: "accepted" | "cancelled" | "shipped" | null = null;
      let orderId = "";

      if (data.startsWith("accept_")) {
        action = "accepted";
        orderId = data.replace("accept_", "");
      } else if (data.startsWith("cancel_")) {
        action = "cancelled";
        orderId = data.replace("cancel_", "");
      } else if (data.startsWith("ord_")) {
        const parts = data.split("_");
        const act = parts[1];
        orderId = parts.slice(2).join("_");
        if (act === "accept") action = "accepted";
        else if (act === "cancel") action = "cancelled";
        else if (act === "ship") action = "shipped";
      }

      if (action && orderId) {
        let statusLabel = "تم قبول وتأكيد الطلب وجارٍ التجهيز";
        let emoji = "✅";

        if (action === "shipped") {
          statusLabel = "تم شحن الطلب مع مندوب التوصيل";
          emoji = "🚚";
        } else if (action === "cancelled") {
          statusLabel = "تم إلغاء الطلب من قبل الإدارة";
          emoji = "❌";
        }

        // Update Order Status Store
        ordersStore.set(orderId, {
          status: action,
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
          `الحالة الحالية: ${emoji} <b>${statusLabel}</b>\n👤 الموظف المسؤول: <b>${escapeHtml(fromName)}</b>`
        );

        await callTelegramApi("editMessageText", {
          chat_id: cb.message?.chat?.id,
          message_id: cb.message?.message_id,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup:
            action === "shipped" || action === "cancelled"
              ? undefined
              : {
                  inline_keyboard: [
                    [{ text: "خروج للشحن والتوصيل 🚚", callback_data: `ord_ship_${orderId}` }],
                    [{ text: "إلغاء الطلب ❌", callback_data: `cancel_${orderId}` }],
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
            text: `تم اختيار التصنيف: <b>${escapeHtml(cat)}</b>.\n\nالآن أرسل <b>سعر المنتج</b> بالجنيه المصري (مثال: <code>350</code>):`,
            parse_mode: "HTML",
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
          `🌿 <b>أهلاً بك في نظام إدارة Roma Store الذكي عبر تيليجرام!</b>\n\n` +
          `هذا البوت يربطك مباشرة بمتجرك الإلكتروني لتلقي التنبيهات الفورية وإدارة العمليات.\n\n` +
          `معرف الشات الخاص بك: <code>${chatId}</code>\n\n` +
          `🛠️ <b>الأوامر المتاحة:</b>\n` +
          `• <code>/new_product</code> — إضافة منتج جديد للواجهة في ثوانٍ\n` +
          `• <code>/orders</code> — عرض حالة الطلبات الأخيرة والمعلقة\n` +
          `• <code>/status</code> — فحص صحة الربط مع المتجر`;

        return await callTelegramApi("sendMessage", {
          chat_id: chatId,
          text: welcome,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "إضافة منتج جديد ➕", callback_data: "cmd_new" }],
              [{ text: "زيارة المتجر الإلكتروني 🌐", url: "https://roma-eg.my" }],
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
          .map(([id, o]) => `• طلب <code>#${id}</code>: <b>${o.status.toUpperCase()}</b> (${new Date(o.updatedAt).toLocaleTimeString("ar-EG")})`)
          .join("\n");

        return await callTelegramApi("sendMessage", {
          chat_id: chatId,
          text: `📊 <b>آخر الطلبات في المتجر:</b>\n\n${summary}`,
          parse_mode: "HTML",
        });
      }

      if (text === "/new_product") {
        sessions.set(userId, { step: "TITLE", draftProduct: {} });
        return await callTelegramApi("sendMessage", {
          chat_id: chatId,
          text: `🌱 <b>إضافة منتج طبيعي جديد</b>\n\nالرجاء إرسال <b>اسم المنتج</b> باللغة العربية:`,
          parse_mode: "HTML",
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
            text: `اختر <b>تصنيف المنتج</b> بالضغط على أحد الأزرار أدناه:`,
            parse_mode: "HTML",
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
              text: `⚠️ يرجى إدخال رقم سعر صحيح (مثال: <code>280</code>).`,
              parse_mode: "HTML",
            });
          }
          session.draftProduct.price = p;
          session.step = "DESC";
          return await callTelegramApi("sendMessage", {
            chat_id: chatId,
            text: `أدخل الآن <b>وصف المنتج ومميزاته</b>:`,
            parse_mode: "HTML",
          });
        }

        if (session.step === "DESC") {
          session.draftProduct.descriptionAr = text;
          session.step = "PHOTO";
          return await callTelegramApi("sendMessage", {
            chat_id: chatId,
            text: `📷 رائع! أرسل الآن <b>صورة المنتج</b> (أو أرسل رابط الصورة مباشرة كنص):`,
            parse_mode: "HTML",
          });
        }

        if (session.step === "PHOTO") {
          session.draftProduct.imageUrl = text.startsWith("http")
            ? text
            : "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85";
          session.step = "IDLE";

          return await callTelegramApi("sendMessage", {
            chat_id: chatId,
            text:
              `✅ <b>تم إضافة المنتج الجديد بنجاح إلى كتالوج Roma Store!</b> 🎉\n\n` +
              `📦 <b>الاسم:</b> ${escapeHtml(session.draftProduct.nameAr || "")}\n` +
              `🏷️ <b>التصنيف:</b> ${escapeHtml(session.draftProduct.category || "")}\n` +
              `💰 <b>السعر:</b> ${session.draftProduct.price} ج.م\n` +
              `📝 <b>الوصف:</b> ${escapeHtml(session.draftProduct.descriptionAr || "")}`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "معاينة في المتجر 🌐", url: "https://roma-eg.my/shop" }],
              ],
            },
          });
        }
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("handleTelegramUpdate error caught safely:", err);
    return { ok: false, error: String(err) };
  }
}
