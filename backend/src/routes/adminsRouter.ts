import express, { RequestHandler } from "express";
import {
  registerAdminController,
  registerInstructorController,
  registerPlanController,
  registerEventController,
  updateAdminProfileController,
  updateInstructorProfileController,
  updateEventProfileController,
  updatePlanController,
  deleteAdminController,
  deactivateCustomerController,
  deleteEventController,
  deletePlanController,
  getAdminController,
  getAllAdminsController,
  getAllInstructorsController,
  getInstructorFeesController,
  createInstructorFeeController,
  deleteLatestInstructorFeeController,
  getAllPastInstructorsController,
  getAllCustomersController,
  getAllPastCustomersController,
  getAllChildrenController,
  getAllPlansController,
  getAllSubscriptionsController,
  getAllEventsController,
  getClassesWithinPeriodController,
  getMessageBoardPostsController,
  createMessageBoardPostController,
} from "../../src/controllers/adminsController";
import {
  downloadNormalizedImportPackageController,
  executeIncrementalCustomerImportController,
  executeIncrementalInstructorImportController,
  executeNormalizedImportController,
  normalizeImportSourceController,
} from "../controllers/adminsImportController";
import {
  getAllSchedulesController,
  updateBusinessScheduleController,
} from "../../src/controllers/schedulesController";
import { registerRoutes } from "../middlewares/validationMiddleware";
import {
  MessageErrorResponse,
  ErrorResponse,
} from "../../../shared/schemas/common";
import {
  AdminIdParams,
  ClassListQuery,
  CreateMessageBoardPostRequest,
  CustomerIdParams,
  InstructorIdParams,
  CreateInstructorFeeRequest,
  InstructorFeeRatesResponse,
  CreateInstructorFeeResponse,
  DeleteLatestInstructorFeeResponse,
  InstructorFeeErrorResponse,
  PlanIdParams,
  EventIdParams,
  RegisterAdminRequest,
  UpdateAdminRequest,
  RegisterInstructorRequest,
  UpdateInstructorRequest,
  RegisterPlanRequest,
  UpdatePlanRequest,
  RegisterEventRequest,
  UpdateEventRequest,
  UpdateBusinessScheduleRequest,
  AdminResponse,
  AdminsListResponse,
  InstructorsListResponse,
  PastInstructorsListResponse,
  CustomersListResponse,
  PastCustomersListResponse,
  ChildrenListResponse,
  PlansListResponse,
  SubscriptionsListResponse,
  EventsListResponse,
  ClassesListResponse,
  MessageBoardPostsResponse,
  CreateMessageBoardPostResponse,
  SchedulesListResponse,
  UpdateAdminResponse,
  UpdateInstructorResponse,
  UpdatePlanResponse,
  UpdateEventResponse,
  DeleteResponse,
  ValidationErrorResponse,
  ConflictErrorResponse,
  InstructorUpdateErrorResponse,
  ImportNormalizeResponse,
  ImportExecuteRequest,
  ImportExecuteResponse,
  ImportExecuteErrorResponse,
  ImportNormalizedDownloadParams,
} from "../../../shared/schemas/admins";

import { AUTH_ROLES } from "../utils/commonUtils";
import { verifyAuthentication } from "../middlewares/auth.middleware";
import upload, {
  uploadAdminImportSourceFile,
  uploadAdminImportZipFile,
} from "../middlewares/upload.middleware";

// Route configurations
const registerAdminConfig = {
  method: "post" as const,
  bodySchema: RegisterAdminRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: registerAdminController,
  openapi: {
    summary: "Register new admin",
    description: "Register a new admin user",
    responses: {
      201: {
        description: "Admin registered successfully",
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Admin with email already exists",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const updateAdminConfig = {
  method: "patch" as const,
  paramsSchema: AdminIdParams,
  bodySchema: UpdateAdminRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: updateAdminProfileController,
  openapi: {
    summary: "Update admin profile",
    description: "Update admin profile information",
    responses: {
      200: {
        description: "Admin updated successfully",
        schema: UpdateAdminResponse,
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Email already in use",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const deleteAdminConfig = {
  method: "delete" as const,
  paramsSchema: AdminIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: deleteAdminController,
  openapi: {
    summary: "Delete admin",
    description: "Delete an admin user",
    responses: {
      200: {
        description: "Admin deleted successfully",
        schema: DeleteResponse,
      },
      400: {
        description: "Invalid admin ID",
        schema: ErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAdminConfig = {
  method: "get" as const,
  paramsSchema: AdminIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getAdminController,
  openapi: {
    summary: "Get admin by ID",
    description: "Get admin details by ID",
    responses: {
      200: {
        description: "Admin details retrieved successfully",
        schema: AdminResponse,
      },
      400: {
        description: "Invalid admin ID",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Admin not found",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const getAllAdminsConfig = {
  method: "get" as const,
  handler: getAllAdminsController,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  openapi: {
    summary: "Get all admins",
    description: "Get list of all admin users",
    responses: {
      200: {
        description: "Admins list retrieved successfully",
        schema: AdminsListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const registerInstructorConfig = {
  method: "post" as const,
  bodySchema: RegisterInstructorRequest,
  middleware: [
    verifyAuthentication(AUTH_ROLES.A),
    upload.none(),
  ] as RequestHandler[],
  handler: registerInstructorController,
  openapi: {
    summary: "Register new instructor",
    description: "Register a new instructor",
    responses: {
      201: {
        description: "Instructor registered successfully",
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Conflict with existing data",
        schema: ConflictErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const registerInstructorWithIconConfig = {
  method: "post" as const,
  bodySchema: RegisterInstructorRequest,
  middleware: [
    verifyAuthentication(AUTH_ROLES.A),
    upload.single("icon"),
  ] as RequestHandler[],
  handler: registerInstructorController,
  openapi: {
    summary: "Register new instructor with icon",
    description: "Register a new instructor with profile icon",
    responses: {
      201: {
        description: "Instructor registered successfully",
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Conflict with existing data",
        schema: ConflictErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const updateInstructorConfig = {
  method: "patch" as const,
  paramsSchema: InstructorIdParams,
  bodySchema: UpdateInstructorRequest,
  middleware: [
    verifyAuthentication(AUTH_ROLES.A),
    upload.none(),
  ] as RequestHandler[],
  handler: updateInstructorProfileController,
  openapi: {
    summary: "Update instructor profile",
    description: "Update instructor profile information",
    responses: {
      200: {
        description: "Instructor updated successfully",
        schema: UpdateInstructorResponse,
      },
      400: {
        description: "Invalid request data",
        schema: InstructorUpdateErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const updateInstructorWithIconConfig = {
  method: "patch" as const,
  paramsSchema: InstructorIdParams,
  bodySchema: UpdateInstructorRequest,
  middleware: [
    verifyAuthentication(AUTH_ROLES.A),
    upload.single("icon"),
  ] as RequestHandler[],
  handler: updateInstructorProfileController,
  openapi: {
    summary: "Update instructor profile with icon",
    description: "Update instructor profile information with profile icon",
    responses: {
      200: {
        description: "Instructor updated successfully",
        schema: UpdateInstructorResponse,
      },
      400: {
        description: "Invalid request data",
        schema: InstructorUpdateErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllInstructorsConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getAllInstructorsController,
  openapi: {
    summary: "Get all instructors",
    description: "Get list of all instructors for admin dashboard",
    responses: {
      200: {
        description: "Instructors list retrieved successfully",
        schema: InstructorsListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getInstructorFeesConfig = {
  method: "get" as const,
  paramsSchema: InstructorIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getInstructorFeesController,
  openapi: {
    summary: "Get instructor fee history",
    description: "Get fee history for one instructor",
    responses: {
      200: {
        description: "Instructor fee history retrieved successfully",
        schema: InstructorFeeRatesResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Instructor not found",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const createInstructorFeeConfig = {
  method: "post" as const,
  paramsSchema: InstructorIdParams,
  bodySchema: CreateInstructorFeeRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: createInstructorFeeController,
  openapi: {
    summary: "Create instructor fee rate",
    description: "Create a new latest instructor fee rate",
    responses: {
      201: {
        description: "Instructor fee rate created successfully",
        schema: CreateInstructorFeeResponse,
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Instructor not found",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Fee rate cannot be created",
        schema: InstructorFeeErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const deleteLatestInstructorFeeConfig = {
  method: "delete" as const,
  paramsSchema: InstructorIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: deleteLatestInstructorFeeController,
  openapi: {
    summary: "Delete latest instructor fee rate",
    description:
      "Delete the latest instructor fee rate and reopen the previous one",
    responses: {
      200: {
        description: "Latest instructor fee rate deleted successfully",
        schema: DeleteLatestInstructorFeeResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Instructor not found",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Latest fee rate cannot be deleted",
        schema: InstructorFeeErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllPastInstructorsConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getAllPastInstructorsController,
  openapi: {
    summary: "Get all past instructors",
    description: "Get list of all past instructors for admin dashboard",
    responses: {
      200: {
        description: "Instructors list retrieved successfully",
        schema: PastInstructorsListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllCustomersConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getAllCustomersController,
  openapi: {
    summary: "Get all customers",
    description: "Get list of all customers for admin dashboard",
    responses: {
      200: {
        description: "Customers list retrieved successfully",
        schema: CustomersListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllPastCustomersConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getAllPastCustomersController,
  openapi: {
    summary: "Get all past customers",
    description: "Get list of all past customers for admin dashboard",
    responses: {
      200: {
        description: "Customers list retrieved successfully",
        schema: PastCustomersListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const deactivateCustomerConfig = {
  method: "patch" as const,
  paramsSchema: CustomerIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: deactivateCustomerController,
  openapi: {
    summary: "Deactivate customer",
    description: "Deactivate a customer in the system",
    responses: {
      200: {
        description: "Customer deactivated successfully",
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllChildrenConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getAllChildrenController,
  openapi: {
    summary: "Get all children",
    description: "Get list of all children for admin dashboard",
    responses: {
      200: {
        description: "Children list retrieved successfully",
        schema: ChildrenListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const registerPlanConfig = {
  method: "post" as const,
  bodySchema: RegisterPlanRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: registerPlanController,
  openapi: {
    summary: "Register new plan",
    description: "Register a new subscription plan",
    responses: {
      201: {
        description: "Plan registered successfully",
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const deletePlanConfig = {
  method: "delete" as const,
  paramsSchema: PlanIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: deletePlanController,
  openapi: {
    summary: "Delete plan",
    description: "Delete a subscription plan",
    responses: {
      200: {
        description: "Plan deleted successfully",
        schema: DeleteResponse,
      },
      400: {
        description: "Invalid plan ID",
        schema: ErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const updatePlanConfig = {
  method: "patch" as const,
  paramsSchema: PlanIdParams,
  bodySchema: UpdatePlanRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: updatePlanController,
  openapi: {
    summary: "Update or delete plan",
    description: "Update plan information or mark for deletion",
    responses: {
      200: {
        description: "Plan updated/deleted successfully",
        schema: UpdatePlanResponse,
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllPlansConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getAllPlansController,
  openapi: {
    summary: "Get all plans",
    description: "Get list of all subscription plans",
    responses: {
      200: {
        description: "Plans list retrieved successfully",
        schema: PlansListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllSubscriptionsConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getAllSubscriptionsController,
  openapi: {
    summary: "Get all subscriptions",
    description: "Get list of all active subscriptions",
    responses: {
      200: {
        description: "Subscriptions list retrieved successfully",
        schema: SubscriptionsListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const registerEventConfig = {
  method: "post" as const,
  bodySchema: RegisterEventRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: registerEventController,
  openapi: {
    summary: "Register new event",
    description: "Register a new calendar event",
    responses: {
      201: {
        description: "Event registered successfully",
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Event name or color already exists",
        schema: ConflictErrorResponse,
      },
      422: {
        description: "Invalid event name format",
        schema: ValidationErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: MessageErrorResponse,
      },
    },
  },
} as const;

const updateEventConfig = {
  method: "patch" as const,
  paramsSchema: EventIdParams,
  bodySchema: UpdateEventRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: updateEventProfileController,
  openapi: {
    summary: "Update event",
    description: "Update event information",
    responses: {
      200: {
        description: "Event updated successfully",
        schema: UpdateEventResponse,
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      409: {
        description: "Event name or color already exists",
        schema: ConflictErrorResponse,
      },
      422: {
        description: "Invalid event name format",
        schema: ValidationErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const deleteEventConfig = {
  method: "delete" as const,
  paramsSchema: EventIdParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: deleteEventController,
  openapi: {
    summary: "Delete event",
    description: "Delete a calendar event",
    responses: {
      200: {
        description: "Event deleted successfully",
        schema: DeleteResponse,
      },
      400: {
        description: "Invalid event ID",
        schema: ErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllEventsConfig = {
  method: "get" as const,
  handler: getAllEventsController,
  middleware: [verifyAuthentication(AUTH_ROLES.ACI)] as RequestHandler[],
  openapi: {
    summary: "Get all events",
    description: "Get list of all calendar events",
    responses: {
      200: {
        description: "Events list retrieved successfully",
        schema: EventsListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getClassesWithinPeriodConfig = {
  method: "get" as const,
  querySchema: ClassListQuery,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: getClassesWithinPeriodController,
  openapi: {
    summary: "Get classes within period",
    description: "Get classes within a 31-day period for admin dashboard",
    responses: {
      200: {
        description: "Classes list retrieved successfully",
        schema: ClassesListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getMessageBoardPostsConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.ACI)] as RequestHandler[],
  handler: getMessageBoardPostsController,
  openapi: {
    summary: "Get message board posts",
    description: "Get message board posts for dashboard and calendars",
    responses: {
      200: {
        description: "Message board posts retrieved successfully",
        schema: MessageBoardPostsResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const createMessageBoardPostConfig = {
  method: "post" as const,
  bodySchema: CreateMessageBoardPostRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: createMessageBoardPostController,
  openapi: {
    summary: "Create message board post",
    description: "Create a new message board post",
    responses: {
      201: {
        description: "Message posted successfully",
        schema: CreateMessageBoardPostResponse,
      },
      400: {
        description: "Invalid request data",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const updateBusinessScheduleConfig = {
  method: "post" as const,
  bodySchema: UpdateBusinessScheduleRequest,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: updateBusinessScheduleController,
  openapi: {
    summary: "Update business schedule",
    description: "Update business operation schedule",
    responses: {
      200: {
        description: "Business schedule updated successfully",
      },
      400: {
        description: "Invalid request data",
        schema: ErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const getAllSchedulesConfig = {
  method: "get" as const,
  middleware: [verifyAuthentication(AUTH_ROLES.ACI)] as RequestHandler[],
  handler: getAllSchedulesController,
  openapi: {
    summary: "Get all schedules",
    description: "Get all business schedules",
    responses: {
      200: {
        description: "Schedules retrieved successfully",
        schema: SchedulesListResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const normalizeImportSourceConfig = {
  method: "post" as const,
  middleware: [
    verifyAuthentication(AUTH_ROLES.A),
    uploadAdminImportSourceFile,
  ] as RequestHandler[],
  handler: normalizeImportSourceController,
  openapi: {
    summary: "Normalize raw import CSV",
    description:
      "Normalize a raw spreadsheet-export CSV into the v1 normalized CSV package",
    responses: {
      200: {
        description: "Normalization succeeded",
        schema: ImportNormalizeResponse,
      },
      400: {
        description: "Invalid or unsupported source file",
        schema: MessageErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      413: {
        description: "Uploaded file exceeds size limit",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const downloadNormalizedImportPackageConfig = {
  method: "get" as const,
  paramsSchema: ImportNormalizedDownloadParams,
  middleware: [verifyAuthentication(AUTH_ROLES.A)] as RequestHandler[],
  handler: downloadNormalizedImportPackageController,
  openapi: {
    summary: "Download normalized import zip",
    description:
      "Download normalized CSV package zip by job ID generated from normalization",
    responses: {
      200: {
        description: "Normalized package zip file",
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Job not found or expired",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const executeNormalizedImportConfig = {
  method: "post" as const,
  bodySchema: ImportExecuteRequest,
  middleware: [
    verifyAuthentication(AUTH_ROLES.A),
    uploadAdminImportZipFile,
  ] as RequestHandler[],
  handler: executeNormalizedImportController,
  openapi: {
    summary: "Execute normalized import",
    description:
      "Validate a normalized import package from uploaded zip or prior normalization job",
    responses: {
      200: {
        description: "Normalized import package validated",
        schema: ImportExecuteResponse,
      },
      400: {
        description: "Normalized package validation failed",
        schema: ImportExecuteErrorResponse,
      },
      401: {
        description: "Unauthorized",
        schema: MessageErrorResponse,
      },
      413: {
        description: "Uploaded file exceeds size limit",
        schema: MessageErrorResponse,
      },
      404: {
        description: "Job not found or expired",
        schema: MessageErrorResponse,
      },
      500: {
        description: "Internal server error",
        schema: ErrorResponse,
      },
    },
  },
} as const;

const incrementalImportOpenApi = (summary: string, description: string) => ({
  summary,
  description,
  responses: {
    200: {
      description: "Incremental import succeeded",
      schema: ImportExecuteResponse,
    },
    400: {
      description: "Incremental package validation failed",
      schema: ImportExecuteErrorResponse,
    },
    401: {
      description: "Unauthorized",
      schema: MessageErrorResponse,
    },
    413: {
      description: "Uploaded file exceeds size limit",
      schema: MessageErrorResponse,
    },
    500: {
      description: "Internal server error",
      schema: ErrorResponse,
    },
  },
});

const incrementalCustomerImportConfig = {
  method: "post" as const,
  middleware: [
    verifyAuthentication(AUTH_ROLES.A),
    uploadAdminImportZipFile,
  ] as RequestHandler[],
  handler: executeIncrementalCustomerImportController,
  openapi: incrementalImportOpenApi(
    "Add customers from a focused import package",
    "Atomically add customers, children, and subscriptions without changing existing records",
  ),
} as const;

const incrementalInstructorImportConfig = {
  method: "post" as const,
  middleware: [
    verifyAuthentication(AUTH_ROLES.A),
    uploadAdminImportZipFile,
  ] as RequestHandler[],
  handler: executeIncrementalInstructorImportController,
  openapi: incrementalImportOpenApi(
    "Add instructors from a focused import package",
    "Atomically add instructors, fees, schedules, and slots without changing existing records",
  ),
} as const;

const validatedRouteConfigs = {
  "/:id": [updateAdminConfig],
  "/admin-list": [getAllAdminsConfig],
  "/admin-list/:id": [deleteAdminConfig, getAdminConfig],
  "/admin-list/register": [registerAdminConfig],
  "/business-schedule": [getAllSchedulesConfig],
  "/business-schedule/update": [updateBusinessScheduleConfig],
  "/child-list": [getAllChildrenConfig],
  "/class-list": [getClassesWithinPeriodConfig],
  "/customer-list": [getAllCustomersConfig],
  "/customer-list/past": [getAllPastCustomersConfig],
  "/customer-list/deactivate/:id": [deactivateCustomerConfig],
  "/event-list": [getAllEventsConfig],
  "/event-list/delete/:id": [deleteEventConfig],
  "/event-list/register": [registerEventConfig],
  "/event-list/update/:id": [updateEventConfig],
  "/instructor-list": [getAllInstructorsConfig],
  "/instructors/:id/fees": [getInstructorFeesConfig, createInstructorFeeConfig],
  "/instructors/:id/fees/latest": [deleteLatestInstructorFeeConfig],
  "/instructor-list/past": [getAllPastInstructorsConfig],
  "/instructor-list/register": [registerInstructorConfig],
  "/instructor-list/register/withIcon": [registerInstructorWithIconConfig],
  "/instructor-list/update/:id": [updateInstructorConfig],
  "/instructor-list/update/:id/withIcon": [updateInstructorWithIconConfig],
  "/import/normalize": [normalizeImportSourceConfig],
  "/import/execute": [executeNormalizedImportConfig],
  "/import/incremental/customers": [incrementalCustomerImportConfig],
  "/import/incremental/instructors": [incrementalInstructorImportConfig],
  "/import/normalized/:jobId/download": [downloadNormalizedImportPackageConfig],
  "/message-board": [getMessageBoardPostsConfig, createMessageBoardPostConfig],
  "/plan-list": [getAllPlansConfig],
  "/plan-list/delete/:id": [deletePlanConfig],
  "/plan-list/register": [registerPlanConfig],
  "/plan-list/update/:id": [updatePlanConfig],
  "/subscription-list": [getAllSubscriptionsConfig],
} as const;

export const adminsRouter = express.Router();

// http://localhost:4000/admins

registerRoutes(adminsRouter, validatedRouteConfigs);

export { validatedRouteConfigs as adminsRouterConfig };
