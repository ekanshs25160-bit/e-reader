import express from "express";
import healthRouter from "./src/routes/healthCheck.routes.js";
import catalogRouter from "./src/routes/catalog.routes.js";
import cors from "cors";
import lookupRouter from './src/routes/lookup.routes.js'
import aiRouter from './src/routes/ai.routes.js'

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any localhost port or server-to-server calls
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/health", healthRouter);
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
