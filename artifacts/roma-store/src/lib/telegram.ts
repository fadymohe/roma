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

export async function notifyTelegramNewOrder(order: TelegramOrderDetails) {
  const itemsText = order.items
    .map(
      (item) =>
        `• *${item.quantity}x* ${item.name} ${item.variantName ? `(${item.variantName})` : ''} — \`${item.price * item.quantity} ج.م\``
    )
    .join('\n');

  const text =
    `🛍️ *طلب شراء جديد تم استلامه في متجر ROMA!* \n` +
    `🔖 رقم الطلب: \`#ROMA-${order.orderId}\`\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 *العميل:* ${order.customerName || 'عميل المتجر'}\n` +
    `📞 *رقم الهاتف:* \`${order.customerPhone}\`\n` +
    `📍 *عنوان التوصيل:* ${order.shippingAddress}\n` +
    `💳 *طريقة الدفع:* ${order.paymentMethod || 'الدفع عند الاستلام'}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 *المنتجات المطلوبة:*\n${itemsText}\n\n` +
    (order.shippingCost ? `🚚 *الشحن:* ${order.shippingCost} ج.م\n` : '') +
    `💰 *الإجمالي النهائي:* *${order.totalAmount} ج.م*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `الحالة: ⏳ *طلب جديد (قيد الانتظار)*`;

  const cleanPhone = (order.customerPhone || '').replace(/\D+/g, '');
  const phoneUrl = cleanPhone ? `tel:${cleanPhone}` : 'https://roma-eg.my';
  const waPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;
  const waUrl = cleanPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ/ة ${order.customerName}، بخصوص طلبكِ رقم #ROMA-${order.orderId} من متجر Roma:`)}` : 'https://roma-eg.my';

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'تجهيز الطلب 🛠️', callback_data: `ord_status_processing_${order.orderId}` },
              { text: 'تم الشحن 🚚', callback_data: `ord_status_shipped_${order.orderId}` },
            ],
            [
              { text: 'تم التسليم ✅', callback_data: `ord_status_completed_${order.orderId}` },
              { text: 'إلغاء الطلب ❌', callback_data: `ord_status_cancelled_${order.orderId}` },
            ],
            [
              { text: 'محادثة واتساب 💬', url: waUrl },
              { text: 'اتصال هاتفي 📞', url: phoneUrl },
            ],
          ],
        },
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to send Telegram alert:', err);
  }
}
