import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import YAML from "yaml";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
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

try {
  const openapiPath = join(__dirname, "..", "openapi.yaml");
  const spec = YAML.parse(readFileSync(openapiPath, "utf8"));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));
} catch {
  console.warn("OpenAPI spec not found — /api/docs disabled");
}

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`FinVault API running at http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
  });
}

export { app };
