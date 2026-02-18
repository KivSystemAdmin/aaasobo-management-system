import express, { RequestHandler } from "express";
import { updateSundayColorController } from "../controllers/schedulesController";
import {
  getSystemStatusController,
  updateSystemStatusController,
} from "../controllers/maintenanceController";
import { maskInstructorsController } from "../controllers/instructorsController";
import { deleteOldClassesController } from "../controllers/classesController";
import { deletePastCustomersController } from "../controllers/customersController";
import { deletePastInstructorsController } from "../controllers/instructorsController";
import { deleteOldBusinessCalendarController } from "../controllers/schedulesController";
import { deleteUnnecessaryPlansController } from "../controllers/plansController";
import { verifyCronJobAuthorization } from "../middlewares/auth.middleware";
import { registerRoutes } from "../middlewares/validationMiddleware";
import { RouteConfig } from "../openapi/routerRegistry";
import {
  UpdateSundayColorRequest,
  SystemStatusResponse,
  UpdateSystemStatusResponse,
  UpdateSundayColorResponse,
  MaskInstructorsResponse,
  DeleteOldClassesResponse,
  DeletePastCustomersResponse,
  DeletePastInstructorsResponse,
  DeleteOldBusinessCalendarResponse,
  DeleteUnnecessaryPlansResponse,
} from "../../../shared/schemas/jobs";
import { MessageErrorResponse } from "../../../shared/schemas/common";

export const jobsRouter = express.Router();

// http://localhost:4000/jobs

// Define route configurations with Zod schemas
const validatedRouteConfigs = {
  "/get-system-status": [
    {
      method: "get",
      middleware: [verifyCronJobAuthorization],
      handler: getSystemStatusController,
      openapi: {
        summary: "Get system status",
        description:
          "Retrieves the current system status (Running or Stop) from the database",
        responses: {
          "200": {
            description: "System status retrieved successfully",
            schema: SystemStatusResponse,
          },
          "500": {
            description: "Internal server error",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
  "/business-schedule/update-sunday-color": [
    {
      method: "post",
      bodySchema: UpdateSundayColorRequest,
      middleware: [verifyCronJobAuthorization],
      handler: updateSundayColorController,
      openapi: {
        summary: "Update Sunday color for next year",
        description:
          "Updates all Sundays in the next year with the specified event color. This is a scheduled cron job endpoint.",
        responses: {
          "200": {
            description: "Sunday colors updated successfully",
            schema: UpdateSundayColorResponse,
          },
          "400": {
            description: "Invalid event ID",
            schema: MessageErrorResponse,
          },
          "500": {
            description: "Failed to update Sunday colors",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
  "/update-system-status": [
    {
      method: "patch",
      middleware: [verifyCronJobAuthorization],
      handler: updateSystemStatusController,
      openapi: {
        summary: "Toggle system status",
        description:
          "Toggles the system status between Running and Stop. This is a scheduled cron job endpoint.",
        responses: {
          "200": {
            description: "System status updated successfully",
            schema: UpdateSystemStatusResponse,
          },
          "500": {
            description: "Failed to update system status",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
  "/mask/instructors": [
    {
      method: "patch",
      middleware: [verifyCronJobAuthorization],
      handler: maskInstructorsController,
      openapi: {
        summary: "Mask instructors who have left",
        description:
          "Masks personal information of instructors who have left the organization and have not been masked yet. This is a scheduled cron job endpoint.",
        responses: {
          "200": {
            description: "Instructors masked successfully",
            schema: MaskInstructorsResponse,
          },
          "500": {
            description: "Error masking instructors",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
  "/delete/old-classes": [
    {
      method: "delete",
      middleware: [verifyCronJobAuthorization],
      handler: deleteOldClassesController,
      openapi: {
        summary: "Delete old classes",
        description:
          "Deletes classes older than a specified threshold. This is a scheduled cron job endpoint.",
        responses: {
          "200": {
            description: "Old classes deleted successfully",
            schema: DeleteOldClassesResponse,
          },
          "500": {
            description: "Error deleting old classes",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
  "/delete/past-customers": [
    {
      method: "delete",
      middleware: [verifyCronJobAuthorization],
      handler: deletePastCustomersController,
      openapi: {
        summary: "Delete past customers",
        description:
          "Deletes customers who have left the service more than 3 years ago. This is a scheduled cron job endpoint.",
        responses: {
          "200": {
            description: "Past customers deleted successfully",
            schema: DeletePastCustomersResponse,
          },
          "500": {
            description: "Error deleting past customers",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
  "/delete/past-instructors": [
    {
      method: "delete",
      middleware: [verifyCronJobAuthorization],
      handler: deletePastInstructorsController,
      openapi: {
        summary: "Delete past instructors",
        description:
          "Deletes instructors who have left the service more than 3 years ago. This is a scheduled cron job endpoint.",
        responses: {
          "200": {
            description: "Past instructors deleted successfully",
            schema: DeletePastInstructorsResponse,
          },
          "500": {
            description: "Error deleting past instructors",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
  "/delete/old-business-calendar": [
    {
      method: "delete",
      middleware: [verifyCronJobAuthorization],
      handler: deleteOldBusinessCalendarController,
      openapi: {
        summary: "Delete old business calendar",
        description:
          "Deletes business calendar older than a specified threshold. This is a scheduled cron job endpoint.",
        responses: {
          "200": {
            description: "Old business calendar deleted successfully",
            schema: DeleteOldBusinessCalendarResponse,
          },
          "500": {
            description: "Error deleting old business calendar",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
  "/delete/unnecessary-plans": [
    {
      method: "delete",
      middleware: [verifyCronJobAuthorization],
      handler: deleteUnnecessaryPlansController,
      openapi: {
        summary: "Delete unnecessary plans",
        description:
          "Deletes plans that are no longer necessary. This is a scheduled cron job endpoint.",
        responses: {
          "200": {
            description: "Unnecessary plans deleted successfully",
            schema: DeleteUnnecessaryPlansResponse,
          },
          "500": {
            description: "Error deleting unnecessary plans",
            schema: MessageErrorResponse,
          },
        },
      },
    },
  ] as const,
} satisfies Record<string, readonly RouteConfig[]>;

// Register routes with validation middleware
registerRoutes(jobsRouter, validatedRouteConfigs);

// Export for OpenAPI registration
export { validatedRouteConfigs as jobsRouterConfig };
