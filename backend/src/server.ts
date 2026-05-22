import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import "dotenv/config";
import { instructorsRouter } from "./routes/instructorsRouter";
import { classesRouter } from "./routes/classesRouter";
import {
  customersRouter,
  customersRouterConfig,
} from "./routes/customersRouter";
import { adminsRouter } from "./routes/adminsRouter";
import { childrenRouter } from "./routes/childrenRouter";
import {
  recurringClassesRouter,
  recurringClassesRouterConfig,
} from "./routes/recurringClassesRouter";
import { plansRouter, plansRouterConfig } from "./routes/plansRouter";
import { eventsRouter, eventsRouterConfig } from "./routes/eventsRouter";
import {
  subscriptionsRouter,
  subscriptionsRouterConfig,
} from "./routes/subscriptionsRouter";
import { indexRouter } from "./routes/indexRouter";
import { usersRouter, usersRouterConfig } from "./routes/usersRouter";
import { instructorsRouterConfig } from "./routes/instructorsRouter";
import { adminsRouterConfig } from "./routes/adminsRouter";
import { childrenRouterConfig } from "./routes/childrenRouter";
import { classesRouterConfig } from "./routes/classesRouter";
import { jobsRouter, jobsRouterConfig } from "./routes/jobsRouter";
import { globalRegistry, createOpenApiSpec } from "./openapi/spec";
import { registerRoutesFromConfig } from "./openapi/routerRegistry";

export const server = express();
server.disable("x-powered-by");

// Set up allowed origin
const allowedOrigin = process.env.FRONTEND_ORIGIN || "";
const corsErrorMessage = "Not allowed by CORS";

// CORS Configuration
server.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests without Origin header
      if (!origin) {
        return callback(null, true);
      }

      if (origin === allowedOrigin) {
        return callback(null, true);
      }

      return callback(new Error(corsErrorMessage));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Access-Control-Allow-Origin"],
  }),
);

// Middleware
server.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");
  next();
});
server.use(express.json());
server.use(cookieParser());

// Routes
server.use("/", indexRouter);
server.use("/instructors", instructorsRouter);
server.use("/classes", classesRouter);
server.use("/customers", customersRouter);
server.use("/admins", adminsRouter);
server.use("/children", childrenRouter);
server.use("/recurring-classes", recurringClassesRouter);
server.use("/plans", plansRouter);
server.use("/events", eventsRouter);
server.use("/subscriptions", subscriptionsRouter);
server.use("/users", usersRouter);
server.use("/jobs", jobsRouter);

// OpenAPI Documentation (only in development)
if (process.env.NODE_ENV === "development") {
  registerRoutesFromConfig(globalRegistry, "/users", usersRouterConfig);
  registerRoutesFromConfig(
    globalRegistry,
    "/instructors",
    instructorsRouterConfig,
  );
  registerRoutesFromConfig(globalRegistry, "/admins", adminsRouterConfig);
  registerRoutesFromConfig(globalRegistry, "/children", childrenRouterConfig);
  registerRoutesFromConfig(globalRegistry, "/classes", classesRouterConfig);
  registerRoutesFromConfig(globalRegistry, "/customers", customersRouterConfig);
  registerRoutesFromConfig(globalRegistry, "/events", eventsRouterConfig);
  registerRoutesFromConfig(globalRegistry, "/plans", plansRouterConfig);
  registerRoutesFromConfig(
    globalRegistry,
    "/recurring-classes",
    recurringClassesRouterConfig,
  );
  registerRoutesFromConfig(
    globalRegistry,
    "/subscriptions",
    subscriptionsRouterConfig,
  );
  registerRoutesFromConfig(globalRegistry, "/jobs", jobsRouterConfig);

  const openApiSpec = createOpenApiSpec();
  server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  server.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(openApiSpec);
  });
}

const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof Error && err.message === corsErrorMessage) {
    return res.status(403).json({ message: "Forbidden origin" });
  }

  console.error("Unhandled request error", {
    error: err instanceof Error ? err.message : "unknown_error",
    path: req.path,
    method: req.method,
    time: new Date().toISOString(),
  });

  return res.status(500).json({ message: "Internal server error" });
};

server.use(errorHandler);
