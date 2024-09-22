import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
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
const allowedOrigin = process.env.FRONTEND_ORIGIN;

// CORS Configuration
server.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: true,
  }),
);

// Middleware
server.use(express.json());

// Cookie-session setup
const KEY1 = process.env.KEY1;
const KEY2 = process.env.KEY2;

if (!KEY1 || !KEY2) {
  throw new Error("Session keys are missing.");
}

server.set("trust proxy", 1);
server.use(
  cookieSession({
    name: "auth-session",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: process.env.FRONTEND_ORIGIN,
    maxAge: 24 * 60 * 60 * 1000,
    keys: [KEY1, KEY2],
  }),
);

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
