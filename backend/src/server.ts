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

export const server = express();

// List of allowed origins
const allowedOrigins = [
  "https://aaasobo-managament-system-frontend.vercel.app",
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
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
    ],
  }),
);

server.options("*", (_, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigins.join(","));
  res.sendStatus(200);
});

// Middleware
server.use(express.json());

// Cookie-session setup
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

// Routes
server.use("/instructors", instructorsRouter);
server.use("/classes", classesRouter);
server.use("/customers", customersRouter);
server.use("/admins", adminsRouter);
server.use("/children", childrenRouter);
server.use("/recurring-classes", recurringClassesRouter);
server.use("/plans", plansRouter);
server.use("/subscriptions", subscriptionsRouter);
