import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import "dotenv/config";
import { instructorsRouter } from "../src/routes/instructorsRouter";
import { classesRouter } from "../src/routes/classesRouter";
import { customersRouter } from "../src/routes/customersRouter";
import { adminsRouter } from "../src/routes/adminsRouter";
import { childrenRouter } from "../src/routes/childrenRouter";
import { recurringClassesRouter } from "../src/routes/recurringClassesRouter";
import { plansRouter } from "../src/routes/plansRouter";
import { subscriptionsRouter } from "../src/routes/subscriptionsRouter";
import { indexRouter } from "../src/routes/indexRouter";

export const server = express();

// List of allowed origins
const allowedOrigins = [
  "https://aaasobo-management-system-frontend.vercel.app",
  "http://localhost:3000",
];

// CORS Configuration
server.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
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

server.use(
  cookieSession({
    name: "auth-session",
    httpOnly: true,
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
