import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import "dotenv/config";
import { instructorsRouter } from "./routes/instructorsRouter";
import { lessonsRouter } from "./routes/lessonsRouter";
import { customersRouter } from "./routes/customersRouter";
import { adminsRouter } from "./routes/adminsRouter";

export const server = express();

const corsOptions = {
  origin: "http://localhost:3000", // Allow only frontend
  credentials: true,
};

// Environment Variables
const KEY1 = process.env.KEY1 || "";
const KEY2 = process.env.KEY2 || "";

// Middleware
server.use(express.json()); // to parse JSON bodies
server.use(cors(corsOptions)); // Allows requests from a different port (3000)
// Cookie-session
server.use(
  cookieSession({
    name: "auth-session",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    keys: [KEY1, KEY2],
  })
);

// Routes
server.use("/instructors", instructorsRouter);
server.use("/lessons", lessonsRouter);
server.use("/customers", customersRouter);
server.use("/admins", adminsRouter);
