import { getAuthenticatedSupabase, saveLocalOrder } from '../lib/supabase-server.js';
import {
  sendOrderConfirmationWhatsApp,
  sendShippingUpdateWhatsApp,
} from '../lib/whatsapp-bridge.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dsgrgbmvbvqwzizbbwxf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: Healthcheck and automatic webhook registration helper
  if (req.method === 'GET') {
    const host = req.headers.host || 'roma-eg.my';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const currentWebhookUrl = `${proto}://${host}/api/telegram-webhook`;

    if (req.query.setup === '1' && BOT_TOKEN) {
      try {
        const setupRes = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(currentWebhookUrl)}&drop_pending_updates=true`
        );
        const setupData = await setupRes.json();
        return res.status(200).json({
          ok: true,
          message: 'Telegram Webhook Setup Result',
          targetUrl: currentWebhookUrl,
          telegramResponse: setupData,
        });
      } catch (err) {
        return res.status(500).json({ ok: false, error: String(err) });
      }
    }

    return res.status(200).json({
      ok: true,
      service: 'ROMA Telegram Webhook Engine',
      webhookUrl: currentWebhookUrl,
      help: 'Add ?setup=1 to set this webhook on Telegram bot.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Handle Telegram Inline Keyboard Buttons (Callback Queries)
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = String(cq.data || '').trim();
      const message = cq.message;
      const chatId = message?.chat?.id;
      const messageId = message?.message_id;

      let action = '';
      let orderId = '';

      if (data.startsWith('ord_status_')) {
        const parts = data.replace('ord_status_', '').split('_');
        action = parts[0];
        orderId = parts.slice(1).join('_');
      } else if (data.startsWith('accept_')) {
        action = 'confirmed';
        orderId = data.replace('accept_', '');
      } else if (data.startsWith('confirm_')) {
        action = 'confirmed';
        orderId = data.replace('confirm_', '');
      } else if (data.startsWith('ship_')) {
        action = 'shipped';
        orderId = data.replace('ship_', '');
      } else if (data.startsWith('deliver_')) {
        action = 'delivered';
        orderId = data.replace('deliver_', '');
      } else if (data.startsWith('cancel_')) {
        action = 'cancelled';
        orderId = data.replace('cancel_', '');
      }

      if (!action || !orderId) {
        // Acknowledge unknown callback
        if (BOT_TOKEN && cq.id) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: cq.id, text: 'تم استلام الإجراء' }),
          }).catch(() => {});
        }
        return res.status(200).json({ ok: true });
      }

      // Map action to human-readable Arabic status label
      let statusLabel = '';
      let toastText = '';
      if (action === 'confirmed') {
        statusLabel = '✅ <b>تم قبول وتأكيد الطلب وجاري تجهيزه</b>';
        toastText = `تم تأكيد الطلب بنجاح ✅`;
      } else if (action === 'shipped') {
        statusLabel = '🚚 <b>الشحنة خرجت للتوصيل وفي الطريق للعميل</b>';
        toastText = `تم تحديث الطلب: في الطريق للتوصيل 🚚`;
      } else if (action === 'delivered') {
        statusLabel = '✨ <b>تم تسليم الطلب بنجاح للعميل (مكتمل)</b>';
        toastText = `تم تسليم الطلب بنجاح للعميل ✨`;
      } else if (action === 'cancelled') {
        statusLabel = '❌ <b>تم إلغاء الطلب</b>';
        toastText = `تم إلغاء الطلب ❌`;
      }

      const cleanId = String(orderId).replace(/^#+/g, '').replace(/^(ROMA-)+/gi, '').trim();

      // 1. Update Supabase database & orders.json with authenticated client
      let orderToNotify = {
        orderId: cleanId,
        orderNumber: `ROMA-${cleanId}`,
        status: action,
      };

      try {
        saveLocalOrder({
          orderId: cleanId,
          orderNumber: `ROMA-${cleanId}`,
          status: action,
        });

        const sbClient = await getAuthenticatedSupabase();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
        let q = sbClient
          .from('orders')
          .update({ status: action, updated_at: new Date().toISOString() });
        if (isUuid) {
          q = q.or(`id.eq.${cleanId},order_number.ilike.*${cleanId}*,order_number.eq.ROMA-${cleanId},order_number.eq.${cleanId}`);
        } else {
          q = q.or(`order_number.ilike.*${cleanId}*,order_number.eq.ROMA-${cleanId},order_number.eq.${cleanId}`);
        }
        const { data: updatedRows } = await q.select();
        if (updatedRows && updatedRows[0]) {
          const row = updatedRows[0];
          orderToNotify = {
            orderId: cleanId,
            orderNumber: row.order_number || `ROMA-${cleanId}`,
            customerName: row.shipping_details?.fullName || row.customer_name || 'عميلة المتجر',
            customerPhone: row.phone || row.shipping_details?.phone,
            shippingAddress: row.shipping_details?.fullAddress || row.shipping_address,
            totalAmount: row.total_amount,
            status: action,
            items: row.items || [],
          };
          saveLocalOrder(orderToNotify);
        }
      } catch (dbErr) {
        console.error('Webhook database status update error:', dbErr);
      }

      // 📱 Trigger WhatsApp message from +201505566847
      try {
        if (orderToNotify.customerPhone) {
          if (action === 'confirmed') {
            await sendOrderConfirmationWhatsApp(orderToNotify);
          } else if (['shipped', 'delivered', 'cancelled'].includes(action)) {
            await sendShippingUpdateWhatsApp(orderToNotify, action);
          }
        }
      } catch (waErr) {
        console.warn('Webhook WhatsApp notification notice:', waErr?.message);
      }

      // 2. Acknowledge button click to Telegram with popup alert
      if (BOT_TOKEN && cq.id) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cq.id,
            text: toastText,
            show_alert: true,
          }),
        }).catch(() => {});
      }

      // 3. Build next interactive keyboard based on new status
      const existingKeyboard = message?.reply_markup?.inline_keyboard || [];
      // Extract WhatsApp URL button if exists
      let waButton = null;
      for (const row of existingKeyboard) {
        for (const btn of row) {
          if (btn.url && btn.url.includes('wa.me')) {
            waButton = btn;
          }
        }
      }

      const nextKeyboard = [];
      if (action === 'confirmed') {
        nextKeyboard.push([
          { text: 'الشحنة في الطريق للتوصيل 🚚', callback_data: `ship_${orderId}` },
          { text: 'تم التسليم بنجاح ✨', callback_data: `deliver_${orderId}` },
        ]);
        nextKeyboard.push([
          { text: 'إلغاء الطلب ❌', callback_data: `cancel_${orderId}` },
        ]);
      } else if (action === 'shipped') {
        nextKeyboard.push([
          { text: 'تم التسليم بنجاح للعميل ✨', callback_data: `deliver_${orderId}` },
          { text: 'إلغاء الطلب ❌', callback_data: `cancel_${orderId}` },
        ]);
      } else if (action === 'delivered') {
        nextKeyboard.push([
          { text: '✨ الطلب مكتمل ومُسلّم بالكامل', callback_data: `done_${orderId}` },
        ]);
      } else if (action === 'cancelled') {
        nextKeyboard.push([
          { text: '❌ تم إلغاء هذا الطلب', callback_data: `cancelled_${orderId}` },
        ]);
      }

      if (waButton) {
        nextKeyboard.push([waButton]);
      }

      // 4. Update the Telegram message text or caption to reflect new status
      if (BOT_TOKEN && chatId && messageId) {
        try {
          const isCaption = message.caption !== undefined;
          const rawContent = isCaption ? (message.caption || '') : (message.text || '');
          let baseContent = rawContent.replace(/\n*📌 \*?تحديث الحالة:\*?[\s\S]*?(?=\n\n|\n*$|$)/gi, '').trim();
          const statusRegex = /(الحالة|الحالة الحالية):[^\n]*/i;
          if (statusRegex.test(baseContent)) {
            baseContent = baseContent.replace(statusRegex, `الحالة: ${statusLabel}`);
          } else {
            baseContent += `\n━━━━━━━━━━━━━━━━━━\nالحالة: ${statusLabel}`;
          }

          const updateNotice = `\n\n📌 <b>آخر تحديث:</b> ${statusLabel}\n🕒 <b>التوقيت:</b> ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
          const finalContent = baseContent + updateNotice;

          const endpoint = isCaption ? 'editMessageCaption' : 'editMessageText';
          const bodyPayload = {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: nextKeyboard,
            },
          };
          if (isCaption) {
            bodyPayload.caption = finalContent;
          } else {
            bodyPayload.text = finalContent;
          }

          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload),
          });
        } catch (editErr) {
          try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                  inline_keyboard: nextKeyboard,
                },
              }),
            });
          } catch (_) {}
        }
      }

      return res.status(200).json({ ok: true, action, orderId });
    }

    return res.status(200).json({ ok: true, message: 'Update received' });
  } catch (err) {
    console.error('Telegram webhook handler critical error:', err);
    return res.status(200).json({ ok: false, error: String(err) });
  }
}
