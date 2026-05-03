import express, { RequestHandler } from "express";
import { registerRoutes } from "../../src/middlewares/validationMiddleware";
import {
  deleteSubscriptionController,
  getSubscriptionByIdController,
  updateSelectTypeUrlController,
  updateSubscriptionToAddClassController,
  updateSubscriptionToTerminateClassController,
} from "../../src/controllers/subscriptionsController";
import {
  CancelSubscriptionBody,
  DeleteSubscriptionResponse,
  SubscriptionIdParams,
  SubscriptionResponse,
  UpdateSubscriptionResponse,
} from "../../../shared/schemas/subscriptions";
import { ErrorResponse } from "../../../shared/schemas/common";
import { RouteConfig } from "../openapi/routerRegistry";
import { verifyAuthentication } from "../middlewares/auth.middleware";
import { AUTH_ROLES } from "../utils/commonUtils";

export const subscriptionsRouter = express.Router();

// http://localhost:4000/subscriptions

const getSubscriptionByIdConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.AC)] as RequestHandler[],
  handler: getSubscriptionByIdController,
  paramsSchema: SubscriptionIdParams,
  openapi: {
    summary: "Get subscription by ID",
    description: "Retrieve a single subscription by its ID",
    responses: {
      "200": {
        description: "Subscription retrieved successfully",
        schema: SubscriptionResponse,
      },
      "404": {
        description: "Subscription not found",
        schema: ErrorResponse,
      },
      "400": {
        description: "Invalid subscription ID",
        schema: ErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
};

const deleteSubscription = {
  method: "delete" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: deleteSubscriptionController,
  paramsSchema: SubscriptionIdParams,
  bodySchema: CancelSubscriptionBody,
  openapi: {
    summary: "Delete a subscription",
    description:
      "Delete a subscription and the recurring classes corresponding to the subscription id",
    responses: {
      "200": {
        description: "Subscription deleted successfully",
        schema: DeleteSubscriptionResponse,
      },
      "404": {
        description: "Subscription not found",
        schema: ErrorResponse,
      },
      "400": {
        description: "Invalid subscription ID",
        schema: ErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const updateSubscriptionToAddClass = {
  method: "patch" as const,
  handler: updateSubscriptionToAddClassController,
  paramsSchema: SubscriptionIdParams,
  openapi: {
    summary: "Update a subscription to add recurring classes",
    description: "Update a subscription to add recurring classes",
    responses: {
      "200": {
        description: "Subscription updated successfully",
        schema: UpdateSubscriptionResponse,
      },
      "404": {
        description: "Subscription not found",
        schema: ErrorResponse,
      },
      "400": {
        description: "Invalid subscription ID",
        schema: ErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
};

const updateSubscriptionToTerminateClass = {
  method: "patch" as const,
  handler: updateSubscriptionToTerminateClassController,
  paramsSchema: SubscriptionIdParams,
  openapi: {
    summary: "Update a subscription to terminate recurring classes",
    description: "Update a subscription to terminate recurring classes",
    responses: {
      "200": {
        description: "Subscription updated successfully",
        schema: UpdateSubscriptionResponse,
      },
      "404": {
        description: "Subscription not found",
        schema: ErrorResponse,
      },
      "400": {
        description: "Invalid subscription ID",
        schema: ErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
};

const updateSelectTypeUrl = {
  method: "patch" as const,
  handler: updateSelectTypeUrlController,
  paramsSchema: SubscriptionIdParams,
  openapi: {
    summary: "Update a SelectType url",
    description: "Update a SelectType url",
    responses: {
      "200": {
        description: "Subscription updated successfully",
        schema: UpdateSubscriptionResponse,
      },
      "404": {
        description: "Subscription not found",
        schema: ErrorResponse,
      },
      "400": {
        description: "Invalid subscription ID",
        schema: ErrorResponse,
      },
      "500": {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
};

const routeConfigs: Record<string, readonly RouteConfig[]> = {
  "/:id": [
    getSubscriptionByIdConfig,
    deleteSubscription,
    updateSubscriptionToAddClass,
    updateSubscriptionToTerminateClass,
  ],
  "/:id/increase-recurring-class": [updateSubscriptionToAddClass],
  "/:id/decrease-recurring-class": [updateSubscriptionToTerminateClass],
  "/:id/update-select-type": [updateSelectTypeUrl],
};

registerRoutes(subscriptionsRouter, routeConfigs);

export const subscriptionsRouterConfig = routeConfigs;
