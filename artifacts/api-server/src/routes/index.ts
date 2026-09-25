import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storefrontRouter from "./storefront";
import telegramRouter from "./telegram";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storefrontRouter);
router.use("/telegram", telegramRouter);

export default router;
