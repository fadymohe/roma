import { Router, type Request, type Response } from "express";
import {
  handleTelegramUpdate,
  notifyMerchantNewOrder,
  ordersStore,
  telegramDispatchLogs,
} from "../telegram/bot";

const router = Router();

/**
 * Telegram Webhook Receiver
 */
router.post("/webhook", async (req: Request, res: Response) => {
  const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expectedSecret && secretHeader !== expectedSecret) {
    res.status(403).json({ error: "Invalid Telegram secret token header" });
    return;
  }

  try {
    const result = await handleTelegramUpdate(req.body);
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

/**
 * Check Telegram Status & Diagnostic Info
 */
router.get("/status", (_req: Request, res: Response) => {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasAdmin = Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID);

  res.json({
    status: hasToken ? "connected" : "simulation_mode",
    mode: hasToken ? "live" : "in-memory-mock",
    hasToken,
    hasAdmin,
    ordersTracked: ordersStore.size,
    recentLogsCount: telegramDispatchLogs.length,
    instructions: hasToken
      ? "Telegram Bot is active in production mode."
      : "Running in mock/simulation mode. Set TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID in environment variables to receive live push alerts on your phone.",
  });
});

/**
 * Get Recent Telegram Dispatch Logs
 */
router.get("/logs", (_req: Request, res: Response) => {
  res.json({
    logs: telegramDispatchLogs.slice(0, 20),
    activeOrders: Array.from(ordersStore.entries()).map(([id, val]) => ({
      orderId: id,
      ...val,
    })),
  });
});

/**
 * Send a Test Order Alert to Telegram (GET or POST)
 */
const handleTestOrder = async (req: Request, res: Response) => {
  const dummyId = Math.floor(1000 + Math.random() * 9000);
  const sampleOrder = {
    orderId: req.body?.orderId || dummyId,
    orderNumber: `TEST-${dummyId}`,
    customerName: req.body?.customerName || "نورا الشريف (طلب تجريبي)",
    customerPhone: req.body?.customerPhone || "01098765432",
    shippingAddress: req.body?.shippingAddress || "القاهرة، المعادي، شارع 9",
    paymentMethod: req.body?.paymentMethod || "الدفع عند الاستلام (COD)",
    items: req.body?.items || [
      { name: "سيروم الهيالورونيك المركز (30ml)", quantity: 1, price: 89 },
      { name: "كريم تجديد خلايا الوجه (50ml)", quantity: 1, price: 148 },
    ],
    shippingCost: 35,
    totalAmount: req.body?.totalAmount || 272,
  };

  const dispatchResult = await notifyMerchantNewOrder(sampleOrder);
  res.json({
    success: true,
    message: "Test order alert dispatched!",
    targetChatId: "8940310160",
    sampleOrder,
    dispatchResult,
  });
};

router.get("/test-order", handleTestOrder);
router.post("/test-order", handleTestOrder);
router.get("/test-telegram", handleTestOrder);

export default router;
