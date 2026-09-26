import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storefrontRouter from "./storefront";
import telegramRouter from "./telegram";
import cartRecoveryRouter from "./cart-recovery";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storefrontRouter);
router.use("/telegram", telegramRouter);
router.use(cartRecoveryRouter);

export default router;
