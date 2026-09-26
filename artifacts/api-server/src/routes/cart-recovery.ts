import { Router, type IRouter, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router: IRouter = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://dsgrgbmvbvqwzizbbwxf.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ3JnYm12YnZxd3ppemJid3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODE0MTMsImV4cCI6MjEwNTk1NzQxM30.kd8bIzK5UzbWIPP4eCHhkflhaRLQ7C1AKb-RhDnvbhM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8358497211:AAF5Tr2e3VHXSt5K1BEvxqa-8bgIaHj-nwA";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "8940310160";

/**
 * Abandoned Cart Recovery Logic
 * Finds carts active more than 2 hours ago with no conversion,
 * flags as 'abandoned', and sends recovery notifications with discount coupon.
 */
export async function processAbandonedCarts() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // 1. Query active carts inactive for > 2 hours
  const { data: abandonedCarts, error } = await supabase
    .from("carts")
    .select(`
      id,
      user_id,
      session_id,
      status,
      last_activity_at,
      profiles:user_id ( full_name, phone ),
      cart_items (
        quantity,
        products ( name_ar, name_en, price, image_url )
      )
    `)
    .eq("status", "active")
    .lt("last_activity_at", twoHoursAgo)
    .is("recovery_email_sent_at", null);

  if (error) {
    console.error("Error querying abandoned carts:", error);
    return { success: false, error: error.message };
  }

  const results: any[] = [];
  const couponCode = "COMEBACK15"; // 15% recovery incentive

  for (const cart of (abandonedCarts || [])) {
    const customerName = (cart.profiles as any)?.full_name || "عميلة روما";
    const customerPhone = (cart.profiles as any)?.phone || "غير محدد";
    const itemCount = Array.isArray(cart.cart_items) ? cart.cart_items.length : 0;
    const recoveryUrl = `https://roma-eg.my/cart?recovery_id=${cart.id}&coupon=${couponCode}`;

    // Update cart status to 'abandoned' and set recovery timestamp
    await supabase
      .from("carts")
      .update({
        status: "abandoned",
        recovery_email_sent_at: new Date().toISOString(),
        coupon_code: couponCode,
      })
      .eq("id", cart.id);

    // Notify Telegram Admin about the abandoned cart
    const message =
      `🛒 *تنبيه سلة متروكة (Abandoned Cart Recovery)*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 *العميلة:* ${customerName}\n` +
      `📞 *رقم الهاتف:* \`${customerPhone}\`\n` +
      `📦 *عدد المنتجات:* ${itemCount} منتج\n` +
      `🕒 *آخر نشاط:* قبل ساعتين فأكثر\n` +
      `🎟️ *كود الخصم الممنوح:* \`${couponCode}\` (-15%)\n` +
      `🔗 *رابط الاستعادة:* [اضغط هنا لاستعادة السلة](${recoveryUrl})\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `تم إرسال إشعار استعادة السلة للعميل عبر القنوات المؤتمتة.`;

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "مراسلة العميلة واتساب 💬", url: `https://wa.me/201012345678?text=${encodeURIComponent(`مرحباً أستاذ/ة ${customerName}، لاحظنا ترككِ مستحضرات في حقيبة التسوق بمتجر روما. نهديكِ كود خصم 15% إضافي ${couponCode} لإتمام طلبك:`)}` },
              ],
            ],
          },
        }),
      });
    } catch (tgErr) {
      console.warn("Telegram notification for abandoned cart failed:", tgErr);
    }

    results.push({
      cartId: cart.id,
      customerName,
      customerPhone,
      itemCount,
      recoveryUrl,
    });
  }

  return {
    success: true,
    processedCount: results.length,
    results,
  };
}

// GET /api/cron/abandoned-carts (Invoked by Vercel Cron or External Schedulers)
router.get("/cron/abandoned-carts", async (_req: Request, res: Response): Promise<void> => {
  try {
    const outcome = await processAbandonedCarts();
    res.status(200).json(outcome);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cron/abandoned-carts (Manual trigger)
router.post("/cron/abandoned-carts", async (_req: Request, res: Response): Promise<void> => {
  try {
    const outcome = await processAbandonedCarts();
    res.status(200).json(outcome);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
