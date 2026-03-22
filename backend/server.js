require("dotenv").config();
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectMongoDB } = require("./config/database");
const { connectNeo4j, closeNeo4j } = require("./config/neo4j");
const { connectRedis } = require("./config/redis");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const interactionRoutes = require("./routes/interactions");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api/", limiter);

// Stricter limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts." },
});
app.use("/api/auth/", authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: "check /health/detailed",
      neo4j: "check /health/detailed",
      redis: "check /health/detailed",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/admin", adminRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    // Connect all databases
    await connectMongoDB();
    await connectNeo4j();
    connectRedis();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await closeNeo4j();
        const mongoose = require("mongoose");
        await mongoose.connection.close();
        console.log("All connections closed. Exiting.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

module.exports = app;
