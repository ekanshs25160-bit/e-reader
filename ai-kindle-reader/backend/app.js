import express from "express";
import healthRouter from "./src/routes/healthCheck.routes.js";
import catalogRouter from "./src/routes/catalog.routes.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
      "http://localhost:8000",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/health", healthRouter);
app.use("/api/catalog", catalogRouter);

// global error middleware (nothing handles the error gracefully type shi)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res
    .status(statusCode)
    .json({ statusCode, success: false, message, errors: err.errors || [] });
});
// })
export default app;
