import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import { kv } from "@vercel/kv";
import { randomBytes } from "crypto";
import cookieParser from "cookie-parser";
import "dotenv/config";
import { instructorsRouter } from "./routes/instructorsRouter";
import { classesRouter } from "./routes/classesRouter";
import { customersRouter } from "./routes/customersRouter";
import { adminsRouter } from "./routes/adminsRouter";
import { childrenRouter } from "./routes/childrenRouter";
import { recurringClassesRouter } from "./routes/recurringClassesRouter";
import { plansRouter } from "./routes/plansRouter";
import { subscriptionsRouter } from "./routes/subscriptionsRouter";
import { indexRouter } from "./routes/indexRouter";

export const server = express();

// Set up allowed origin
const allowedOrigin = process.env.FRONTEND_ORIGIN || "";

// CORS Configuration
server.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Access-Control-Allow-Origin"],
  }),
);

// Middleware
server.use(express.json());
server.use(cookieParser());

// For production (Use vercel KV)
if (process.env.NODE_ENV === "production") {
  const generateSessionId = () => randomBytes(16).toString("hex");

  server.use(async (req, res, next) => {
    const sessionId = req.cookies["session-id"];

    if (sessionId) {
      const sessionData = await kv.get(sessionId);
      req.session = sessionData || {};
    } else {
      const newSessionId = generateSessionId();
      res.cookie("session-id", newSessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });
      req.session = {};
    }

    next();
  });

  server.use(async (req, _, next) => {
    const sessionId = req.cookies["session-id"];
    if (sessionId && req.session) {
      await kv.set(sessionId, req.session, { ex: 24 * 60 * 60 });
    }
    next();
  });
} else {
  const KEY1 = process.env.KEY1 || "";
  const KEY2 = process.env.KEY2 || "";

  server.use(
    cookieSession({
      name: "auth-session",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      keys: [KEY1, KEY2],
    }),
  );
}

// Routes
server.use("/", indexRouter);
server.use("/instructors", instructorsRouter);
server.use("/classes", classesRouter);
server.use("/customers", customersRouter);
server.use("/admins", adminsRouter);
server.use("/children", childrenRouter);
server.use("/recurring-classes", recurringClassesRouter);
server.use("/plans", plansRouter);
server.use("/subscriptions", subscriptionsRouter);
