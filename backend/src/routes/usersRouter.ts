import express from "express";
import {
  authenticateUserController,
  sendUserResetEmailController,
  updatePasswordController,
  verifyResetTokenController,
} from "../controllers/usersController";
import { z } from "zod";
import { registerRoutes } from "../middlewares/validationMiddleware";
import { ErrorResponse } from "../../../shared/schemas/common";
import {
  authenticateSchema,
  sendPasswordResetSchema,
  verifyResetTokenSchema,
  updatePasswordSchema,
} from "../../../shared/schemas/users";

const authenticateConfig = {
  method: "post" as const,
  bodySchema: authenticateSchema,
  handler: authenticateUserController,
  openapi: {
    summary: "Authenticate user",
    description: "Authenticate user credentials",
    responses: {
      200: {
        description: "Authentication successful",
        schema: z.object({
          id: z.number().int().positive().describe("User ID"),
        }),
      },
      400: {
        description: "Bad request - validation failed",
        schema: ErrorResponse,
      },
      401: { description: "Unauthorized - invalid credentials" },
      403: { description: "Forbidden - email not verified (customers only)" },
      503: {
        description: "Service unavailable - failed to send verification email",
      },
    },
  },
} as const;

const sendPasswordResetConfig = {
  method: "post" as const,
  bodySchema: sendPasswordResetSchema,
  handler: sendUserResetEmailController,
  openapi: {
    summary: "Send password reset email",
    description: "Send password reset email",
    responses: {
      202: {
        description:
          "Password reset request accepted if the account can receive email",
      },
      400: {
        description: "Bad request - validation failed",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const verifyResetTokenConfig = {
  method: "post" as const,
  bodySchema: verifyResetTokenSchema,
  handler: verifyResetTokenController,
  openapi: {
    summary: "Verify password reset token",
    description: "Verify password reset token",
    responses: {
      200: { description: "Token is valid" },
      400: {
        description: "Bad request - validation failed",
        schema: ErrorResponse,
      },
      404: { description: "Token not found or user not found" },
      410: { description: "Token expired" },
    },
  },
} as const;

const updatePasswordConfig = {
  method: "patch" as const,
  bodySchema: updatePasswordSchema,
  handler: updatePasswordController,
  openapi: {
    summary: "Update password",
    description: "Update user password using reset token",
    responses: {
      201: { description: "Password updated successfully" },
      400: {
        description: "Bad request - validation failed",
        schema: ErrorResponse,
      },
      404: { description: "Token not found or user not found" },
      410: { description: "Token expired" },
    },
  },
} as const;

// http://localhost:4000/users
const routeConfigs = {
  "/authenticate": [authenticateConfig],
  "/send-password-reset": [sendPasswordResetConfig],
  "/update-password": [updatePasswordConfig],
  "/verify-reset-token": [verifyResetTokenConfig],
} as const;

export const usersRouter = express.Router();
registerRoutes(usersRouter, routeConfigs);

export { routeConfigs as usersRouterConfig };
