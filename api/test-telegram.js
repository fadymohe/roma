const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8358497211:AAF5Tr2e3VHXSt5K1BEvxqa-8bgIaHj-nwA';
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '8940310160';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const dummyOrderId = Math.floor(100000 + Math.random() * 900000);
  const dummyOrder = {
    orderId: dummyOrderId,
    orderNumber: `ROMA-TEST-${dummyOrderId}`,
    customerName: 'عميل تجريبي — اختبار الربط الفوري',
    customerPhone: '01099887766',
    shippingAddress: 'القاهرة، المعادي، شارع النصر',
    paymentMethod: 'الدفع عند الاستلام (COD)',
    items: [
      { name: 'سيروم النضارة الطبيعي الفاخر (50ml)', quantity: 2, price: 175, variantName: '50ml' },
      { name: 'كريم استعادة نضارة وترطيب الوجه', quantity: 1, price: 145 },
    ],
    shippingCost: 35,
    totalAmount: 530,
  };

  const cleanPhone = (dummyOrder.customerPhone || '').replace(/\D+/g, '');
  const waPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;

  const itemsHtml = dummyOrder.items
    .map(
      (item) =>
        `• <b>${item.quantity}x</b> ${escapeHtml(item.name)} — <code>${item.price * item.quantity} ج.م</code>`
    )
    .join('\n');

  const messageHtml =
    `🛍️ <b>طلب جديد تم استلامه في متجر ROMA! (رسالة اختبار)</b>\n` +
    `🔖 رقم الطلب: <code>#${escapeHtml(dummyOrder.orderNumber)}</code>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>العميل:</b> ${escapeHtml(dummyOrder.customerName)}\n` +
    `📞 <b>رقم الهاتف:</b> <code>${escapeHtml(dummyOrder.customerPhone)}</code>\n` +
    `📍 <b>عنوان التوصيل:</b> ${escapeHtml(dummyOrder.shippingAddress)}\n` +
    `💳 <b>طريقة الدفع:</b> ${escapeHtml(dummyOrder.paymentMethod)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📦 <b>المنتجات المطلوبة:</b>\n${itemsHtml}\n\n` +
    `🚚 <b>تكلفة الشحن:</b> ${dummyOrder.shippingCost} ج.م\n` +
    `💰 <b>المجموع النهائي:</b> <b>${dummyOrder.totalAmount} ج.م</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `الحالة الحالية: ⏳ <b>قيد الانتظار والتحقق (Pending)</b>`;

  // Required interactive inline keyboard buttons:
  // [ قبول الطلب ✅ ] (callback data: accept_<order_id>)
  // [ إلغاء الطلب ❌ ] (callback data: cancel_<order_id>)
  // [ محادثة واتساب مباشرة 💬 ] (wa URL with customer phone)
  const keyboard = {
    inline_keyboard: [
      [
        { text: 'قبول الطلب ✅', callback_data: `accept_${dummyOrder.orderId}` },
        { text: 'إلغاء الطلب ❌', callback_data: `cancel_${dummyOrder.orderId}` },
      ],
      [
        { text: 'محادثة العميل عبر واتساب 💬', url: `https://wa.me/${waPhone}` },
      ],
    ],
  };

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: messageHtml,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }),
    });
    const result = await tgRes.json();

    if (!result?.ok) {
      console.error('Telegram dispatch error on /api/test-telegram:', JSON.stringify(result));
      return res.status(500).json({
        success: false,
        message: 'Telegram API returned error',
        error: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test order alert dispatched successfully to Telegram Chat ID 8940310160!',
      targetChatId: ADMIN_CHAT_ID,
      dummyOrder,
      telegramResult: result,
    });
  } catch (error) {
    console.error('Telegram dispatch error:', JSON.stringify(error));
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to communicate with Telegram API',
      error: String(error),
    });
  }
}
