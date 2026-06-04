import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import YAML from "yaml";
import { resolveOpenApiPath } from "./lib/paths.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { accountsRouter } from "./routes/accounts.js";
import { transfersRouter } from "./routes/transfers.js";
import { payeesRouter, billsRouter } from "./routes/payees.js";
import { cardsRouter } from "./routes/cards.js";
import { budgetsRouter } from "./routes/budgets.js";
import {
  portfoliosRouter,
  ordersRouter,
  watchlistRouter,
} from "./routes/investments.js";
import { loansRouter } from "./routes/loans.js";
import { notificationsRouter } from "./routes/notifications.js";
import { adminRouter } from "./routes/admin.js";

/**
 * Express 5 + serverless-http: body-parser skips when socket.readable is false.
 * Required for Netlify Functions so JSON POST bodies (login, etc.) are parsed.
 */
function serverlessJsonBodyFix(req: Request, _res: Response, next: NextFunction) {
  if (req.socket && !req.socket.readable) {
    (req.socket as { readable?: boolean }).readable = true;
  }
  next();
}

function parseCorsOrigins() {
  const fromEnv = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8888",
  ];
}

export function createApp() {
  const app = express();

  app.use(cors({ origin: parseCorsOrigins() }));
  app.use(serverlessJsonBodyFix);
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "finvault-api", version: "1.0.0" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/accounts", accountsRouter);
  app.use("/api/transfers", transfersRouter);
  app.use("/api/payees", payeesRouter);
  app.use("/api/bills", billsRouter);
  app.use("/api/cards", cardsRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/portfolios", portfoliosRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/watchlist", watchlistRouter);
  app.use("/api/loans", loansRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/admin", adminRouter);

  const openapiPath = resolveOpenApiPath();
  if (openapiPath) {
    try {
      const spec = YAML.parse(readFileSync(openapiPath, "utf8"));
      app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));
    } catch (err) {
      console.warn("OpenAPI spec failed to load — /api/docs disabled", err);
    }
  } else {
    console.warn("OpenAPI spec not found — /api/docs disabled");
  }

  app.use(errorHandler);
  return app;
}
