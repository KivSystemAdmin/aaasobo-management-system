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

const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000", // Allow only frontend
  credentials: true,
};

// Environment Variables
const KEY1 = process.env.KEY1 || "";
const KEY2 = process.env.KEY2 || "";

// Middleware
server.use(express.json()); // to parse JSON bodies
server.use("*", cors(corsOptions)); // CORS settings for all routes
// Cookie-session
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
