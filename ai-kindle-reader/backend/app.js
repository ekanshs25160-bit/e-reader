import express from "express";
import healthRouter from "./src/routes/healthCheck.routes.js";
import catalogRouter from "./src/routes/catalog.routes.js";
import cors from "cors";
import lookupRouter from './src/routes/lookup.routes.js'
import aiRouter from './src/routes/ai.routes.js'

const app = express();

const allowedOrigins = [
  'http://localhost:3000', // Local Next.js development
  'https://e-reader-jj18.onrender.com', // Your live Render frontend URL (replace with your actual frontend URL)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow cookies/authorization headers if needed
}));
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
