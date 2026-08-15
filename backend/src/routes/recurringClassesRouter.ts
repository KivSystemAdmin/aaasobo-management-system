import express, { RequestHandler } from "express";
import {
  createRegularClassController,
  getRegularClassByIdController,
  getRegularClassesBySubscriptionIdController,
  updateRegularClassController,
  getRecurringClassesByInstructorIdController,
  getRecurringClassesHistoryCountController,
} from "../../src/controllers/recurringClassesController";
import { registerRoutes } from "../middlewares/validationMiddleware";
import {
  RecurringClassIdParams,
  GetRecurringClassesBySubscriptionQuery,
  GetRecurringClassesByInstructorQuery,
  GetRecurringClassesHistoryCountQuery,
  CreateRecurringClassRequest,
  UpdateRecurringClassRequest,
} from "../../../shared/schemas/recurringClasses";
import { MessageErrorResponse } from "../../../shared/schemas/common";
import { verifyAuthentication } from "../middlewares/auth.middleware";
import { AUTH_ROLES } from "../utils/commonUtils";

export const recurringClassesRouter = express.Router();

// http://localhost:4000/recurring-classes

// Route configurations
const getBySubscriptionIdConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.AC)] as RequestHandler[],
  handler: getRegularClassesBySubscriptionIdController,
  querySchema: GetRecurringClassesBySubscriptionQuery,
  openapi: {
    summary: "Get recurring classes by subscription ID",
    description: "Retrieves all recurring classes for a specific subscription",
    responses: {
      "200": { description: "List of recurring classes" },
      "400": {
        description: "Invalid query parameters",
        schema: MessageErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const getHistoryCountBySubscriptionIdConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.AC)] as RequestHandler[],
  handler: getRecurringClassesHistoryCountController,
  querySchema: GetRecurringClassesHistoryCountQuery,
  openapi: {
    summary: "Get recurring classes history count by subscription ID",
    description:
      "Retrieves the count of historical recurring classes for a subscription",
    responses: {
      "200": { description: "Recurring classes history count" },
      "400": {
        description: "Invalid query parameters",
        schema: MessageErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const getByInstructorIdConfig = {
  method: "get" as const,
  handler: getRecurringClassesByInstructorIdController,
  querySchema: GetRecurringClassesByInstructorQuery,
  openapi: {
    summary: "Get recurring classes by instructor ID",
    description: "Retrieves all recurring classes for a specific instructor",
    responses: {
      "200": { description: "List of recurring classes" },
      "400": {
        description: "Invalid query parameters",
        schema: MessageErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const getByIdConfig = {
  method: "get" as const,
  handler: getRegularClassByIdController,
  paramsSchema: RecurringClassIdParams,
  openapi: {
    summary: "Get recurring class by ID",
    description: "Retrieves a specific recurring class by its ID",
    responses: {
      "200": { description: "Recurring class information" },
      "400": {
        description: "Invalid recurring class ID",
        schema: MessageErrorResponse,
      },
      "404": {
        description: "Recurring class not found",
        schema: MessageErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const createConfig = {
  method: "post" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: createRegularClassController,
  bodySchema: CreateRecurringClassRequest,
  openapi: {
    summary: "Create a new recurring class",
    description: "Creates a new recurring class with the provided details",
    responses: {
      "201": { description: "Recurring class created successfully" },
      "400": {
        description: "Validation failed or business logic error",
        schema: MessageErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const updateConfig = {
  method: "put" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.AC)] as RequestHandler[],
  handler: updateRegularClassController,
  paramsSchema: RecurringClassIdParams,
  bodySchema: UpdateRecurringClassRequest,
  openapi: {
    summary: "Update a recurring class",
    description:
      "Updates an existing recurring class with the provided details",
    responses: {
      "200": { description: "Recurring class updated successfully" },
      "400": {
        description: "Validation failed or business logic error",
        schema: MessageErrorResponse,
      },
      "404": {
        description: "Recurring class not found",
        schema: MessageErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const routeConfigs = {
  "/": [getBySubscriptionIdConfig, createConfig],
  "/history-count": [getHistoryCountBySubscriptionIdConfig],
  "/by-instructorId": [getByInstructorIdConfig],
  "/:id": [getByIdConfig, updateConfig],
} as const;

// Register all routes with validation
registerRoutes(recurringClassesRouter, routeConfigs);

// Export for OpenAPI registration
export { routeConfigs as recurringClassesRouterConfig };
