"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_session_1 = __importDefault(require("cookie-session"));
require("dotenv/config");
const instructorsRouter_1 = require("./routes/instructorsRouter");
const classesRouter_1 = require("./routes/classesRouter");
const customersRouter_1 = require("./routes/customersRouter");
const adminsRouter_1 = require("./routes/adminsRouter");
const childrenRouter_1 = require("./routes/childrenRouter");
const recurringClassesRouter_1 = require("./routes/recurringClassesRouter");
const plansRouter_1 = require("./routes/plansRouter");
const subscriptionsRouter_1 = require("./routes/subscriptionsRouter");
exports.server = (0, express_1.default)();
// List of allowed origins
const allowedOrigins = [
  "https://aaasobo-managament-system-frontend.vercel.app",
  "http://localhost:3000",
];
// CORS Configuration
exports.server.use(
  (0, cors_1.default)({
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
exports.server.options("*", (_, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigins.join(","));
  res.sendStatus(200);
});
// Middleware
exports.server.use(express_1.default.json());
// Cookie-session setup
const KEY1 = process.env.KEY1 || "";
const KEY2 = process.env.KEY2 || "";
exports.server.use(
  (0, cookie_session_1.default)({
    name: "auth-session",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    keys: [KEY1, KEY2],
  }),
);
// Routes
exports.server.use("/instructors", instructorsRouter_1.instructorsRouter);
exports.server.use("/classes", classesRouter_1.classesRouter);
exports.server.use("/customers", customersRouter_1.customersRouter);
exports.server.use("/admins", adminsRouter_1.adminsRouter);
exports.server.use("/children", childrenRouter_1.childrenRouter);
exports.server.use(
  "/recurring-classes",
  recurringClassesRouter_1.recurringClassesRouter,
);
exports.server.use("/plans", plansRouter_1.plansRouter);
exports.server.use("/subscriptions", subscriptionsRouter_1.subscriptionsRouter);
