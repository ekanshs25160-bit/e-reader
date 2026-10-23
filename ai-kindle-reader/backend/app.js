import express from "express";
import healthRouter from "./src/routes/healthCheck.routes.js";
import catalogRouter from "./src/routes/catalog.routes.js";
import cors from "cors";
import lookupRouter from './src/routes/lookup.routes.js'
import aiRouter from './src/routes/ai.routes.js'

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "https://e-reader-jj18.onrender.com",
  ];

  if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".onrender.com")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/catalog", catalogRouter);
app.use('/api/lookup',lookupRouter)
app.use('/api/ai', aiRouter)

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
