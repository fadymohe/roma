export interface TelegramOrderDetails {
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
}

/**
 * Dispatches order notification securely through the serverless backend API.
 * The BOT_TOKEN and ADMIN_CHAT_ID are strictly kept on the server/environment side.
 */
export async function notifyTelegramNewOrder(order: TelegramOrderDetails) {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend notification dispatch notice:', err);
    return { ok: false, error: err };
  }
}
