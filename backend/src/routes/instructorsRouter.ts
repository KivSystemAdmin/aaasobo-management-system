import express, { RequestHandler } from "express";
import { z } from "zod";
import {
  getInstructor,
  getInstructorIdByClassIdController,
  getAllInstructorProfilesController,
  getInstructorProfileController,
  getCalendarClassesController,
  getInstructorProfilesController,
  getSameDateClassesController,
  getInstructorProfilesByEnglishBackgroundController,
} from "../../src/controllers/instructorsController";
import { registerRoutes } from "../middlewares/validationMiddleware";
import {
  MessageErrorResponse,
  ErrorResponse,
} from "../../../shared/schemas/common";
import {
  InstructorProfilesResponse,
  AllInstructorProfilesResponse,
  InstructorIdParams,
  InstructorResponse,
  SimpleInstructorProfile,
  InstructorSchedulesResponse,
  ClassIdParams,
  ClassInstructorResponse,
  EnglishBackgroundParams,
  AvailableSlotsQuery,
  InstructorAvailableSlotsQuery,
  AvailableSlotsResponse,
  InstructorAvailableSlotsResponse,
  InstructorCalendarSlotsResponse,
  InstructorCalendarClassesResponse,
  InstructorClassParams,
  ActiveScheduleQuery,
  ActiveScheduleResponse,
  InstructorScheduleParams,
  CreateScheduleRequest,
  CreateScheduleResponse,
  InstructorAbsenceParams,
  CreateAbsenceRequest,
  InstructorAbsencesResponse,
  CreateAbsenceResponse,
  DeleteAbsenceResponse,
  TagCatalogResponse,
  InstructorTagsResponse,
  TagIdParams,
  UpdateInstructorTagsRequest,
} from "../../../shared/schemas/instructors";
import {
  InstructorPayrollErrorResponse,
  InstructorPayrollQuery,
  InstructorPayrollResponse,
} from "../../../shared/schemas/admins";
import {
  type RequestWithId,
  parseId,
} from "../../src/middlewares/parseId.middleware";
import { verifyAuthentication } from "../middlewares/auth.middleware";
import {
  getInstructorSchedulesController,
  getInstructorScheduleController,
  createInstructorScheduleController,
  getInstructorAvailableSlotsController,
  getInstructorCalendarSlotsController,
  getAllAvailableSlotsController,
  getActiveInstructorScheduleController,
  getAvailableSlotsByTypeController,
} from "../../src/controllers/instructorScheduleController";
import {
  getInstructorAbsencesController,
  addInstructorAbsenceController,
  removeInstructorAbsenceController,
} from "../../src/controllers/instructorAbsenceController";
import { AUTH_ROLES } from "../utils/commonUtils";
import {
  createTagController,
  deleteTagController,
  getInstructorTagsController,
  getTagCatalogController,
  updateInstructorTagsController,
} from "../controllers/instructorTagsController";
import { getInstructorPayrollController } from "../controllers/adminsController";

const profilesConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.ACI)] as RequestHandler[],
  handler: getInstructorProfilesController,
  openapi: {
    summary: "Get instructor profiles",
    description: "Get public instructor profiles for customer dashboard",
    responses: {
      200: {
        description: "Successfully retrieved instructor profiles",
        schema: InstructorProfilesResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const englishBackgroundProfilesConfig = {
  method: "get" as const,
  paramsSchema: EnglishBackgroundParams,
  middleware: [verifyAuthentication(AUTH_ROLES.ACI)] as RequestHandler[],
  handler: getInstructorProfilesByEnglishBackgroundController,
  openapi: {
    summary: "Get instructor profiles by English background",
    description:
      "Get public instructor profiles for customer dashboard filtered by English background",
    responses: {
      200: {
        description:
          "Successfully retrieved instructor profiles filtered by English background",
        schema: InstructorProfilesResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const allProfilesConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.AC)] as RequestHandler[],
  handler: getAllInstructorProfilesController,
  openapi: {
    summary: "Get all instructor profiles",
    description:
      "Get detailed instructor profiles for authenticated admin users",
    responses: {
      200: {
        description: "Successfully retrieved detailed instructor profiles",
        schema: AllInstructorProfilesResponse,
      },
      401: {
        description: "Unauthorized - authentication required",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Instructors not found",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const instructorByIdConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  middleware: [
    verifyAuthentication(AUTH_ROLES.AI, {
      requireIdCheck: AUTH_ROLES.I,
    }),
  ] as RequestHandler[],
  handler: getInstructor,
  openapi: {
    summary: "Get instructor by ID",
    description: "Get detailed instructor information by ID",
    responses: {
      200: {
        description: "Successfully retrieved instructor details",
        schema: InstructorResponse,
      },
      400: {
        description: "Invalid instructor ID parameter",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Instructor not found",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const instructorProfileConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  middleware: [
    verifyAuthentication(AUTH_ROLES.AI, {
      requireIdCheck: AUTH_ROLES.I,
    }),
  ] as RequestHandler[],
  handler: getInstructorProfileController,
  openapi: {
    summary: "Get simple instructor profile",
    description: "Get basic instructor profile information by ID",
    responses: {
      200: {
        description: "Successfully retrieved instructor profile",
        schema: SimpleInstructorProfile,
      },
      400: {
        description: "Invalid instructor ID parameter",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Instructor not found",
      },
      500: {
        description: "Internal server error",
      },
    },
  },
} as const;

const instructorPayrollConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  querySchema: InstructorPayrollQuery,
  middleware: [
    verifyAuthentication(AUTH_ROLES.I, {
      requireIdCheck: AUTH_ROLES.I,
    }),
  ] as RequestHandler[],
  handler: getInstructorPayrollController,
  openapi: {
    summary: "Get own instructor payroll",
    description:
      "Get the authenticated instructor's payroll summary for one month",
    responses: {
      200: {
        description: "Instructor payroll retrieved successfully",
        schema: InstructorPayrollResponse,
      },
      400: {
        description: "Invalid query parameters",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      403: {
        description: "Instructor ID does not match the authenticated user",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Instructor not found",
        schema: MessageErrorResponse,
      },
      422: {
        description: "Payroll data cannot be resolved",
        schema: InstructorPayrollErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const instructorSchedulesConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getInstructorSchedulesController,
  openapi: {
    summary: "Get instructor schedules",
    description: "Get all schedule versions for an instructor by ID",
    responses: {
      200: {
        description: "Successfully retrieved instructor schedules",
        schema: InstructorSchedulesResponse,
      },
      400: {
        description: "Invalid instructor ID parameter",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const classInstructorConfig = {
  method: "get" as const,
  paramsSchema: ClassIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getInstructorIdByClassIdController,
  openapi: {
    summary: "Get instructor ID by class ID",
    description: "Get the instructor ID for a specific class",
    responses: {
      200: {
        description: "Successfully retrieved instructor ID",
        schema: ClassInstructorResponse,
      },
      400: {
        description: "Invalid class ID parameter",
        schema: ErrorResponse,
      },
      404: {
        description: "Class not found",
        schema: ErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const availableSlotsConfig = {
  method: "get" as const,
  querySchema: AvailableSlotsQuery,
  middleware: [verifyAuthentication(AUTH_ROLES.AC)] as RequestHandler[],
  handler: getAllAvailableSlotsController,
  openapi: {
    summary: "Get all available instructor slots",
    description:
      "Get available time slots across all instructors for a date range",
    responses: {
      200: {
        description: "Successfully retrieved available slots",
        schema: AvailableSlotsResponse,
      },
      400: {
        description: "Invalid query parameters",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const availableSlotsByTypeConfig = {
  method: "get" as const,
  querySchema: AvailableSlotsQuery,
  middleware: [verifyAuthentication(AUTH_ROLES.AC)] as RequestHandler[],
  handler: getAvailableSlotsByTypeController,
  openapi: {
    summary: "Get native or non native available instructor slots",
    description:
      "Get available time slots across native or non native instructors for a date range",
    responses: {
      200: {
        description: "Successfully retrieved available slots",
        schema: AvailableSlotsResponse,
      },
      400: {
        description: "Invalid query parameters",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const sameDateClassesConfig = {
  method: "get" as const,
  paramsSchema: InstructorClassParams,
  middleware: [
    verifyAuthentication(AUTH_ROLES.AI, {
      requireIdCheck: AUTH_ROLES.I,
    }),
  ] as RequestHandler[],
  handler: getSameDateClassesController,
  openapi: {
    summary: "Get same-date classes",
    description:
      "Get classes on the same date for a specific instructor and class",
    responses: {
      200: {
        description: "Successfully retrieved same-date classes",
        // Using any schema for now since the response is complex class data
      },
      400: {
        description: "Invalid instructor ID or class ID",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
      },
    },
  },
} as const;

const calendarClassesConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  middleware: [
    verifyAuthentication(AUTH_ROLES.AI, {
      requireIdCheck: AUTH_ROLES.I,
    }),
  ] as RequestHandler[],
  handler: getCalendarClassesController,
  openapi: {
    summary: "Get instructor calendar classes",
    description: "Get calendar classes for an instructor",
    responses: {
      200: {
        description: "Successfully retrieved calendar classes",
        schema: InstructorCalendarClassesResponse,
      },
      400: {
        description: "Invalid instructor ID",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
      },
    },
  },
} as const;

const calendarSlotsConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  querySchema: InstructorAvailableSlotsQuery,
  middleware: [
    verifyAuthentication(AUTH_ROLES.AI, {
      requireIdCheck: AUTH_ROLES.I,
    }),
  ] as RequestHandler[],
  handler: getInstructorCalendarSlotsController,
  openapi: {
    summary: "Get instructor calendar slots",
    description:
      "Get instructor calendar slots including open availability, classes, and absences",
    responses: {
      200: {
        description: "Successfully retrieved instructor calendar slots",
        schema: InstructorCalendarSlotsResponse,
      },
      400: {
        description: "Invalid instructor ID or query parameters",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
      },
    },
  },
} as const;

const activeScheduleConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  querySchema: ActiveScheduleQuery,
  middleware: [verifyAuthentication(AUTH_ROLES.ACI)] as RequestHandler[],
  handler: getActiveInstructorScheduleController,
  openapi: {
    summary: "Get active instructor schedule",
    description: "Get the active schedule for an instructor on a specific date",
    responses: {
      200: {
        description: "Successfully retrieved active schedule",
        schema: ActiveScheduleResponse,
      },
      400: {
        description: "Invalid instructor ID or effective date parameter",
        schema: MessageErrorResponse,
      },
      404: {
        description: "No active schedule found for this instructor",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const scheduleByIdConfig = {
  method: "get" as const,
  paramsSchema: InstructorScheduleParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getInstructorScheduleController,
  openapi: {
    summary: "Get instructor schedule by ID",
    description:
      "Get a specific schedule version for an instructor by schedule ID",
    responses: {
      200: {
        description: "Successfully retrieved schedule",
        schema: ActiveScheduleResponse,
      },
      400: {
        description: "Invalid instructor ID or schedule ID parameter",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Schedule not found",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const createScheduleConfig = {
  method: "post" as const,
  paramsSchema: InstructorIdParams,
  bodySchema: CreateScheduleRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: createInstructorScheduleController,
  openapi: {
    summary: "Create instructor schedule",
    description: "Create a new schedule version for an instructor",
    responses: {
      201: {
        description: "Schedule version created successfully",
        schema: CreateScheduleResponse,
      },
      400: {
        description: "Invalid request parameters or body",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized - authentication required",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const instructorAvailableSlotsConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  querySchema: InstructorAvailableSlotsQuery,
  middleware: [verifyAuthentication(AUTH_ROLES.AC)] as RequestHandler[],
  handler: getInstructorAvailableSlotsController,
  openapi: {
    summary: "Get instructor available slots",
    description: "Get available time slots for a specific instructor",
    responses: {
      200: {
        description: "Successfully retrieved available slots",
        schema: InstructorAvailableSlotsResponse,
      },
      400: {
        description: "Invalid parameters",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Instructor not found",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const instructorAbsencesConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getInstructorAbsencesController,
  openapi: {
    summary: "Get instructor absences",
    description: "Get all absences for a specific instructor",
    responses: {
      200: {
        description: "Successfully retrieved instructor absences",
        schema: InstructorAbsencesResponse,
      },
      400: {
        description: "Invalid instructor ID parameter",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const createAbsenceConfig = {
  method: "post" as const,
  paramsSchema: InstructorIdParams,
  bodySchema: CreateAbsenceRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: addInstructorAbsenceController,
  openapi: {
    summary: "Add instructor absence",
    description: "Add a new absence date for an instructor",
    responses: {
      201: {
        description: "Instructor absence added successfully",
        schema: CreateAbsenceResponse,
      },
      400: {
        description: "Invalid request parameters or body",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized - authentication required",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Conflict with completed class at the target slot",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const deleteAbsenceConfig = {
  method: "delete" as const,
  paramsSchema: InstructorAbsenceParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: removeInstructorAbsenceController,
  openapi: {
    summary: "Remove instructor absence",
    description: "Remove an absence date for an instructor",
    responses: {
      200: {
        description: "Instructor absence removed successfully",
        schema: DeleteAbsenceResponse,
      },
      400: {
        description: "Invalid request parameters",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized - authentication required",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const tagCatalogConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.ACI)] as RequestHandler[],
  handler: getTagCatalogController,
  openapi: {
    summary: "Get instructor tag catalog",
    description: "Get active instructor tags and usage counts",
    responses: {
      200: { description: "Tag catalog", schema: TagCatalogResponse },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const createTagConfig = {
  method: "post" as const,
  bodySchema: z.object({ label: z.string().min(1).max(80) }),
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: createTagController,
  openapi: {
    summary: "Create instructor tag",
    description: "Create a shared instructor tag (admin only)",
    responses: {
      201: { description: "Created" },
      400: { description: "Bad request", schema: MessageErrorResponse },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const deleteTagConfig = {
  method: "delete" as const,
  paramsSchema: TagIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: deleteTagController,
  openapi: {
    summary: "Delete instructor tag",
    description: "Soft-delete an instructor tag (admin only)",
    responses: {
      200: { description: "Deleted" },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const instructorTagsConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getInstructorTagsController,
  openapi: {
    summary: "Get instructor tags",
    description: "Get shared tag catalog and selected tags for an instructor",
    responses: {
      200: { description: "Instructor tags", schema: InstructorTagsResponse },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const updateInstructorTagsConfig = {
  method: "put" as const,
  paramsSchema: InstructorIdParams,
  bodySchema: UpdateInstructorTagsRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: updateInstructorTagsController,
  openapi: {
    summary: "Update instructor tags",
    description: "Replace selected tags for an instructor",
    responses: {
      200: { description: "Updated" },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const validatedRouteConfigs = {
  "/all-profiles": [allProfilesConfig],
  "/available-slots": [availableSlotsConfig],
  "/available-slots/by-type": [availableSlotsByTypeConfig],
  "/class/:id": [classInstructorConfig],
  "/profiles": [profilesConfig],
  "/profiles/english-background/:englishBackground": [
    englishBackgroundProfilesConfig,
  ],
  "/tags": [tagCatalogConfig, createTagConfig],
  "/tags/:id": [deleteTagConfig],
  "/:id": [instructorByIdConfig],
  "/:id/tags": [instructorTagsConfig, updateInstructorTagsConfig],
  "/:id/absences": [instructorAbsencesConfig, createAbsenceConfig],
  "/:id/absences/:absentAt": [deleteAbsenceConfig],
  "/:id/available-slots": [instructorAvailableSlotsConfig],
  "/:id/calendar-slots": [calendarSlotsConfig],
  "/:id/calendar-classes": [calendarClassesConfig],
  "/:id/classes/:classId/same-date": [sameDateClassesConfig],
  "/:id/payroll": [instructorPayrollConfig],
  "/:id/profile": [instructorProfileConfig],
  "/:id/schedules": [instructorSchedulesConfig, createScheduleConfig],
  "/:id/schedules/active": [activeScheduleConfig],
  "/:id/schedules/:scheduleId": [scheduleByIdConfig],
} as const;

export const instructorsRouter = express.Router();

// http://localhost:4000/instructors

// Register validated routes (includes all routes with validation)
registerRoutes(instructorsRouter, validatedRouteConfigs);

export { validatedRouteConfigs as instructorsRouterConfig };
