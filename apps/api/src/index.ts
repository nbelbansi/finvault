import { createApp } from "./app.js";

const app = createApp();
const PORT = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`FinVault API running at http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
  });
}

export { app };
