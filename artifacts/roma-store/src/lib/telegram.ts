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
    `الحالة: ⏳ *قيد المراجعة والتجهيز*`;

  const phoneUrl = order.customerPhone ? `tel:${order.customerPhone.replace(/\s+/g, '')}` : 'https://roma-eg.my';

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
              { text: 'قبول وتأكيد الطلب ✅', callback_data: `ord_ok_${order.orderId}` },
              { text: 'الاتصال بالعميل 📞', url: phoneUrl },
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
