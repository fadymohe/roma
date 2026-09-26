const BOT_TOKEN = '8358497211:AAF5Tr2e3VHXSt5K1BEvxqa-8bgIaHj-nwA';
const ADMIN_CHAT_ID = '8940310160';

export interface TelegramOrderDetails {
  orderId: number | string;
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
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function notifyTelegramNewOrder(order: TelegramOrderDetails) {
  const itemsHtml = order.items
    .map(
      (item) =>
        `• <b>${item.quantity}x</b> ${escapeHtml(item.name)} ${item.variantName ? `(${escapeHtml(item.variantName)})` : ''} — <code>${item.price * item.quantity} ج.م</code>`
    )
    .join('\n');

  const text =
    `🛍️ <b>طلب شراء جديد تم استلامه في متجر ROMA!</b>\n` +
    `🔖 رقم الطلب: <code>#ROMA-${order.orderId}</code>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>العميل:</b> ${escapeHtml(order.customerName || 'عميل المتجر')}\n` +
    `📞 <b>رقم الهاتف:</b> <code>${escapeHtml(order.customerPhone)}</code>\n` +
    `📍 <b>عنوان التوصيل:</b> ${escapeHtml(order.shippingAddress)}\n` +
    `💳 <b>طريقة الدفع:</b> ${escapeHtml(order.paymentMethod || 'الدفع عند الاستلام')}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 <b>المنتجات المطلوبة:</b>\n${itemsHtml}\n\n` +
    (order.shippingCost ? `🚚 <b>الشحن:</b> ${order.shippingCost} ج.م\n` : '') +
    `💰 <b>الإجمالي النهائي:</b> <b>${order.totalAmount} ج.م</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `الحالة: ⏳ <b>طلب جديد (قيد الانتظار)</b>`;

  const cleanPhone = (order.customerPhone || '').replace(/\D+/g, '');
  const waPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;
  const waUrl = cleanPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ/ة ${order.customerName}، بخصوص طلبكِ رقم #ROMA-${order.orderId} من متجر Roma:`)}`
    : 'https://roma-eg.my';

  const primaryKeyboard = [
    [
      { text: 'قبول الطلب ✅', callback_data: `accept_${order.orderId}` },
      { text: 'إلغاء الطلب ❌', callback_data: `cancel_${order.orderId}` },
    ],
    [
      { text: 'الاتصال بالعميل 📞', url: `tel:${cleanPhone}` },
    ],
  ];

  const fallbackKeyboard = [
    [
      { text: 'قبول الطلب ✅', callback_data: `accept_${order.orderId}` },
      { text: 'إلغاء الطلب ❌', callback_data: `cancel_${order.orderId}` },
    ],
    [
      { text: 'محادثة واتساب مباشرة 💬', url: waUrl },
    ],
  ];

  // 1. First attempt: Safe HTML mode via /api/tg cloud proxy (bypasses ISP blocks in Egypt)
  try {
    let res = await fetch(`/api/tg/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: primaryKeyboard,
        },
      }),
    });
    let data = await res.json();
    if (data.ok) return data;

    if (!data.ok && data.description?.includes('inline keyboard button URL')) {
      res = await fetch(`/api/tg/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: fallbackKeyboard,
          },
        }),
      });
      data = await res.json();
      if (data.ok) return data;
    }
  } catch (err) {
    // try direct endpoint if proxy not reachable
    try {
      let directRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: primaryKeyboard,
          },
        }),
      });
      let data = await directRes.json();
      if (data.ok) return data;

      if (!data.ok && data.description?.includes('inline keyboard button URL')) {
        directRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: fallbackKeyboard,
            },
          }),
        });
        data = await directRes.json();
        if (data.ok) return data;
      }
    } catch (directErr) {
      console.error('Telegram direct fetch error:', directErr);
    }
  }

  // 2. Failsafe attempt: Plain Text without HTML tags
  try {
    const plainText =
      `🛍️ طلب شراء جديد في متجر ROMA!\n` +
      `رقم الطلب: ROMA-${order.orderId}\n` +
      `العميل: ${order.customerName}\n` +
      `الهاتف: ${order.customerPhone}\n` +
      `العنوان: ${order.shippingAddress}\n` +
      `الدفع: ${order.paymentMethod}\n` +
      `الإجمالي: ${order.totalAmount} ج.م\n` +
      `الحالة: طلب جديد قيد الانتظار`;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: plainText,
        reply_markup: {
          inline_keyboard: fallbackKeyboard,
        },
      }),
    });
    return await res.json();
  } catch (fallbackErr) {
    console.error('Telegram failsafe alert error:', fallbackErr);
  }
}
