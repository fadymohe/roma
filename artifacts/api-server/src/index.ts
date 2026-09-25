import express from "express";
import app from "./app";
import { logger } from "./lib/logger";

export default app;
export { app, express };

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

if (!process.env.VERCEL) {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}
