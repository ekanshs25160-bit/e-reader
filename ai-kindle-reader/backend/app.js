import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import healthRouter from "./src/routes/healthCheck.routes.js";
import catalogRouter from "./src/routes/catalog.routes.js";
import lookupRouter from './src/routes/lookup.routes.js';
import aiRouter from './src/routes/ai.routes.js';

const app = express();


// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   const allowedOrigins = [
//     "http://localhost:3000",
//     "https://e-reader-jj18.onrender.com",
//   ];

//   if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".onrender.com")) {
//     res.setHeader("Access-Control-Allow-Origin", origin || "*");
//   }
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Allow-Credentials", "true");

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(204);
//   }
//   next();
// });

// AI---------------------
app.set("trust proxy", 1);

// Parse CORS_ORIGIN env variable (comma-separated list)
const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== "production";

const corsOptions = {
  origin: (origin, callback) => {
    // If no origin provided (e.g. server-side, curl without -H Origin), allow
    if (!origin) {
      return callback(null, true);
    }

    // Check env-based allowed origins list
    if (envOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Dev-only allowance for localhost and 127.0.0.1
    if (isDev) {
      try {
        const parsed = new URL(origin);
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          return callback(null, true);
        }
      } catch {
        // ignore invalid URL format
      }
    }

    // Disallowed origin: return false, so no CORS headers are set
    return callback(null, false);
  },
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  exposedHeaders: ["Content-Length", "Content-Disposition"],
  maxAge: 86400,
  credentials: true,
};

app.use(cors(corsOptions));

// Rate limiters: 20/min on /api/ai, 120/min elsewhere
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    success: false,
    message: "Too many AI requests from this IP, please try again in a minute.",
  },
});

const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl?.startsWith("/api/ai"),
  message: {
    statusCode: 429,
    success: false,
    message: "Too many requests from this IP, please try again in a minute.",
  },
});

app.use("/api/ai", aiRateLimiter);
app.use(generalRateLimiter);

// AI ---------------------------

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/catalog", catalogRouter);
app.use('/api/lookup', lookupRouter);
app.use('/api/ai', aiRouter);

// Global error middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res
    .status(statusCode)
    .json({ statusCode, success: false, message, errors: err.errors || [] });
});

export default app;
