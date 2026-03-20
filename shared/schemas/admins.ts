import { z } from "zod";

export const AdminIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Admin ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

export const CustomerIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Customer ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

export const InstructorIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Instructor ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

export const InstructorPayrollQuery = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be in YYYY-MM format"),
});

export const CreateInstructorFeeRequest = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/, "currency must be a 3-letter code"),
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "effectiveFrom must be in YYYY-MM-DD format"),
  trialFee: z.number().int().nonnegative(),
  regularFee: z.number().int().nonnegative(),
  cancelFee: z.number().int().nonnegative(),
  cancelWithoutNoticeFee: z.number().int().nonnegative(),
});

export const PlanIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Plan ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

export const EventIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Event ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

// Admin registration and update schemas
export const RegisterAdminRequest = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const UpdateAdminRequest = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format"),
});

// Instructor registration and update schemas
export const RegisterInstructorRequest = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().min(1, "Nickname is required"),
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  birthdate: z.string().min(1, "Birthdate is required"),
  lifeHistory: z.string(),
  favoriteFood: z.string(),
  hobby: z.string(),
  messageForChildren: z.string(),
  workingTime: z.string(),
  skill: z.string(),
  classURL: z.string().min(1, "Class URL is required"),
  meetingId: z.string().min(1, "Meeting ID is required"),
  passcode: z.string().min(1, "Passcode is required"),
  englishBackground: z.string().describe("English background requirement"),
});

export const UpdateInstructorRequest = z.object({
  name: z.string().min(1, "Name is required"),
  leavingDate: z.string().nullable().optional(),
  email: z.email("Invalid email format"),
  nickname: z.string().min(1, "Nickname is required"),
  birthdate: z.string().min(1, "Birthdate is required"),
  workingTime: z.string(),
  lifeHistory: z.string(),
  favoriteFood: z.string(),
  hobby: z.string(),
  messageForChildren: z.string(),
  skill: z.string(),
  classURL: z.string().min(1, "Class URL is required"),
  meetingId: z.string().min(1, "Meeting ID is required"),
  passcode: z.string().min(1, "Passcode is required"),
  englishBackground: z.string().describe("English background requirement"),
});

// Plan schemas
export const RegisterPlanRequest = z.object({
  planNameEng: z.string().min(1, "Plan name (English) is required"),
  planNameJpn: z.string().min(1, "Plan name (Japanese) is required"),
  weeklyClassTimes: z
    .number()
    .int()
    .positive("Weekly class times must be a positive integer"),
  description: z.string().min(1, "Description is required"),
  englishBackground: z.number().describe("English background requirement"),
});

export const UpdatePlanRequest = z.object({
  planNameEng: z.string().min(1, "Plan name (English) is required"),
  planNameJpn: z.string().min(1, "Plan name (Japanese) is required"),
  description: z.string().min(1, "Description is required"),
  englishBackground: z.number().describe("English background requirement"),
});

// Event schemas
export const RegisterEventRequest = z.object({
  eventNameJpn: z
    .string()
    .min(1, "Event Name (Japanese) is required.")
    .regex(
      /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9 /¥,.\-ー・々〇@!()]+$/u,
      "Event Name (Japanese) must contain Japanese characters.",
    ),
  eventNameEng: z
    .string()
    .min(1, "Event Name (English) is required.")
    .regex(
      /^[a-zA-Z0-9 /¥,.\-@!_()]+$/,
      "Event Name (English) must contain alphanumeric characters.",
    ),
  color: z.string().min(1, "Color is required"),
});

export const UpdateEventRequest = z.object({
  eventNameJpn: z
    .string()
    .min(1, "Event Name (Japanese) is required.")
    .regex(
      /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9 /¥,.\-ー・々〇@!()]+$/u,
      "Event Name (Japanese) must contain Japanese characters.",
    ),
  eventNameEng: z
    .string()
    .min(1, "Event Name (English) is required.")
    .regex(
      /^[a-zA-Z0-9 /¥,.\-@!_()]+$/,
      "Event Name (English) must contain only alphanumeric characters.",
    ),
  color: z.string().min(1, "Color is required"),
});

// Business schedule update schema
export const UpdateBusinessScheduleRequest = z.object({
  eventId: z.number().int().positive("Event ID must be a positive integer"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

// Basic admin profile schema
export const AdminProfile = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});

// Single admin response
export const AdminResponse = z.object({
  admin: AdminProfile,
});

// Admin list item for table display
export const AdminListItem = z.object({
  No: z.number(),
  ID: z.number(),
  Admin: z.string(),
  Email: z.string(),
});

export const AdminsListResponse = z.object({
  data: z.array(AdminListItem),
});

// Instructor list item for table display
export const InstructorListItem = z.object({
  No: z.number(),
  ID: z.number(),
  Instructor: z.string(),
  English: z.string(),
  "Full Name": z.string(),
  Email: z.string(),
});

export const InstructorsListResponse = z.object({
  data: z.array(InstructorListItem),
});

export const InstructorPayrollFeePeriod = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  trialFee: z.number().int(),
  regularFee: z.number().int(),
  cancelFee: z.number().int(),
  cancelWithoutNoticeFee: z.number().int(),
});

export const InstructorPayrollDailyBreakdown = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  counts: z.object({
    trial: z.number().int().nonnegative(),
    regular: z.number().int().nonnegative(),
    cancel: z.number().int().nonnegative(),
    cancelWithoutNotice: z.number().int().nonnegative(),
  }),
  total: z.number().int(),
});

export const InstructorPayrollPeriod = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceLastUpdatedAt: z.iso.datetime().nullable(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  counts: z.object({
    trial: z.number().int().nonnegative(),
    regular: z.number().int().nonnegative(),
    cancel: z.number().int().nonnegative(),
    cancelWithoutNotice: z.number().int().nonnegative(),
  }),
  subtotals: z.object({
    trial: z.number().int().nonnegative(),
    regular: z.number().int().nonnegative(),
    cancel: z.number().int().nonnegative(),
    cancelWithoutNotice: z.number().int().nonnegative(),
  }),
  total: z.number().int(),
  dailyBreakdown: z.array(InstructorPayrollDailyBreakdown),
  appliedFeePeriods: z.array(InstructorPayrollFeePeriod),
});

export const InstructorPayrollResponse = z.object({
  instructorId: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  timezone: z.literal("Asia/Tokyo"),
  periods: z.tuple([InstructorPayrollPeriod, InstructorPayrollPeriod]),
});

export const InstructorPayrollErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
});

export const InstructorFeeRate = z.object({
  id: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  trialFee: z.number().int().nonnegative(),
  regularFee: z.number().int().nonnegative(),
  cancelFee: z.number().int().nonnegative(),
  cancelWithoutNoticeFee: z.number().int().nonnegative(),
});

export const InstructorFeeRatesResponse = z.object({
  instructorId: z.number().int().positive(),
  fees: z.array(InstructorFeeRate),
});

export const CreateInstructorFeeResponse = z.object({
  message: z.string(),
  fee: InstructorFeeRate,
});

export const DeleteLatestInstructorFeeResponse = z.object({
  message: z.string(),
  deletedFeeId: z.number().int().positive(),
  reactivatedFeeId: z.number().int().positive(),
});

export const InstructorFeeErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
});

// Past instructor list item for table display
export const PastInstructorListItem = z.object({
  No: z.number(),
  ID: z.number(),
  "Past Instructor": z.string(),
  "End Date (JST)": z.string(),
});

export const PastInstructorsListResponse = z.object({
  data: z.array(PastInstructorListItem),
});

// Customer list item for table display
export const CustomerListItem = z.object({
  No: z.number(),
  ID: z.number(),
  Customer: z.string(),
  Children: z.string().nullable(),
  Email: z.string(),
  Prefecture: z.string(),
});

export const CustomersListResponse = z.object({
  data: z.array(CustomerListItem),
});

// Past customer list item for table display
export const PastCustomerListItem = z.object({
  No: z.number(),
  ID: z.number(),
  "Past Customer": z.string(),
  "Past Children": z.string().nullable(),
  "End Date (JST)": z.string(),
});

export const PastCustomersListResponse = z.object({
  data: z.array(PastCustomerListItem),
});

// Child list item for table display
export const ChildListItem = z.object({
  No: z.number(),
  ID: z.number(),
  Child: z.string(),
  "Customer ID": z.number(),
  Customer: z.string(),
  Birthdate: z.string().nullable(),
  "Personal Info": z.string().nullable(),
});

export const ChildrenListResponse = z.object({
  data: z.array(ChildListItem),
});

// Plan list item for table display
export const PlanListItem = z.object({
  No: z.number(),
  ID: z.number(),
  "Plan (Japanese)": z.string(),
  "Plan (English)": z.string(),
  "Weekly Class Times": z.number(),
  Description: z.string(),
});

export const PlansListResponse = z.object({
  data: z.array(PlanListItem),
});

// Subscription list item for table display
export const SubscriptionListItem = z.object({
  No: z.number(),
  ID: z.number(),
  Customer: z.string(),
  "Subscription Plan": z.string(),
  Note: z.string(),
});

export const SubscriptionsListResponse = z.object({
  data: z.array(SubscriptionListItem),
});

// Event list item for table display
export const EventListItem = z.object({
  No: z.number(),
  ID: z.number(),
  Event: z.string(),
  "Event (Japanese)": z.string(),
  "Event (English)": z.string(),
  "Color Code": z.string(),
});

export const EventsListResponse = z.object({
  data: z.array(EventListItem),
});

// Class list item for table display
export const ClassListItem = z.object({
  No: z.number(),
  ID: z.number(),
  "Date/Time (JST)": z.string(),
  Day: z.string(),
  Instructor: z.string(),
  InstructorID: z.number().nullable(),
  Children: z.string().nullable(),
  Customer: z.string(),
  CustomerID: z.number(),
  Status: z.string(),
  "Class Code": z.string(),
});

export const ClassesListResponse = z.object({
  data: z.array(ClassListItem),
});

// Schedule list item for table display
export const ScheduleListItem = z.object({
  id: z.number(),
  date: z.string(),
  event: z.string(),
  color: z.string(),
});

export const SchedulesListResponse = z.object({
  organizedData: z.array(ScheduleListItem),
});

// Update response schemas
export const UpdateAdminResponse = z.object({
  message: z.string(),
  admin: AdminProfile,
});

export const UpdateInstructorResponse = z.object({
  message: z.string(),
  instructor: z
    .object({
      id: z.number(),
      name: z.string(),
      nickname: z.string(),
      email: z.string(),
      terminationAt: z.iso.datetime().nullable(),
    })
    .passthrough(), // Allow additional properties
});

export const UpdatePlanResponse = z.object({
  message: z.string(),
  plan: z
    .object({
      id: z.number(),
      name: z.string(),
      description: z.string(),
    })
    .passthrough(),
});

export const UpdateEventResponse = z.object({
  message: z.string(),
  event: z
    .object({
      id: z.number(),
      name: z.string(),
      color: z.string(),
    })
    .passthrough(),
});

export const DeleteResponse = z.object({
  message: z.string(),
  id: z.number(),
});

export const UpdateSubscriptionResponse = z.object({
  message: z.string(),
  id: z.number(),
});

export const UpdateSubscriptionToAddClassRequest = z.object({
  planId: z.number(),
  times: z.number(),
});

export const UpdateSubscriptionToTerminateClassRequest = z.object({
  planId: z.number(),
  recurringClassIds: z.array(z.number()),
});

// Error response schemas
export const ValidationErrorResponse = z.object({
  items: z.array(z.string()),
});

export const ConflictErrorResponse = z.object({
  items: z.union([z.string(), z.array(z.string())]),
});

export const InstructorUpdateErrorResponse = z.record(z.string(), z.string());

export const ImportNormalizeGeneratedEmailItem = z.object({
  row: z.number().int().positive(),
  customerName: z.string(),
  generatedEmail: z.string(),
});

export const ImportNormalizedDownloadParams = z.object({
  jobId: z.string().min(1, "jobId is required"),
});

export const ImportNormalizeResponse = z.object({
  jobId: z.string(),
  files: z.record(z.string(), z.string()),
  report: z.object({
    rawRows: z.number().int().nonnegative(),
    normalizedRowsByFile: z.record(z.string(), z.number().int().nonnegative()),
    generatedCustomerEmails: z.array(ImportNormalizeGeneratedEmailItem),
    warnings: z.array(z.string()),
  }),
});

export const ImportExecuteRequest = z.object({
  jobId: z.string().min(1).optional(),
});

export const ImportExecuteValidationIssue = z.object({
  file: z.string(),
  row: z.number().int().positive().nullable(),
  column: z.string().nullable(),
  message: z.string(),
});

export const ImportExecuteReport = z.object({
  rowsByFile: z.record(z.string(), z.number().int().nonnegative()),
});

export const ImportExecuteResponse = z.object({
  message: z.string(),
  imported: z.boolean(),
  report: ImportExecuteReport,
});

export const ImportExecuteErrorResponse = z.object({
  message: z.string(),
  report: ImportExecuteReport,
  issues: z.array(ImportExecuteValidationIssue),
});

export type AdminIdParams = z.infer<typeof AdminIdParams>;
export type CustomerIdParams = z.infer<typeof CustomerIdParams>;
export type InstructorIdParams = z.infer<typeof InstructorIdParams>;
export type InstructorPayrollQuery = z.infer<typeof InstructorPayrollQuery>;
export type CreateInstructorFeeRequest = z.infer<
  typeof CreateInstructorFeeRequest
>;
export type PlanIdParams = z.infer<typeof PlanIdParams>;
export type EventIdParams = z.infer<typeof EventIdParams>;

export type RegisterAdminRequest = z.infer<typeof RegisterAdminRequest>;
export type UpdateAdminRequest = z.infer<typeof UpdateAdminRequest>;
export type RegisterInstructorRequest = z.infer<
  typeof RegisterInstructorRequest
>;
export type UpdateInstructorRequest = z.infer<typeof UpdateInstructorRequest>;
export type RegisterPlanRequest = z.infer<typeof RegisterPlanRequest>;
export type UpdatePlanRequest = z.infer<typeof UpdatePlanRequest>;
export type RegisterEventRequest = z.infer<typeof RegisterEventRequest>;
export type UpdateEventRequest = z.infer<typeof UpdateEventRequest>;
export type UpdateBusinessScheduleRequest = z.infer<
  typeof UpdateBusinessScheduleRequest
>;

export type AdminProfile = z.infer<typeof AdminProfile>;
export type AdminResponse = z.infer<typeof AdminResponse>;
export type AdminsListResponse = z.infer<typeof AdminsListResponse>;
export type InstructorsListResponse = z.infer<typeof InstructorsListResponse>;
export type InstructorPayrollFeePeriod = z.infer<
  typeof InstructorPayrollFeePeriod
>;
export type InstructorPayrollDailyBreakdown = z.infer<
  typeof InstructorPayrollDailyBreakdown
>;
export type InstructorPayrollPeriod = z.infer<typeof InstructorPayrollPeriod>;
export type InstructorPayrollResponse = z.infer<
  typeof InstructorPayrollResponse
>;
export type InstructorPayrollErrorResponse = z.infer<
  typeof InstructorPayrollErrorResponse
>;
export type InstructorFeeRate = z.infer<typeof InstructorFeeRate>;
export type InstructorFeeRatesResponse = z.infer<
  typeof InstructorFeeRatesResponse
>;
export type CreateInstructorFeeResponse = z.infer<
  typeof CreateInstructorFeeResponse
>;
export type DeleteLatestInstructorFeeResponse = z.infer<
  typeof DeleteLatestInstructorFeeResponse
>;
export type InstructorFeeErrorResponse = z.infer<
  typeof InstructorFeeErrorResponse
>;
export type PastInstructorsListResponse = z.infer<
  typeof PastInstructorsListResponse
>;
export type CustomersListResponse = z.infer<typeof CustomersListResponse>;
export type PastCustomersListResponse = z.infer<
  typeof PastCustomersListResponse
>;
export type ChildrenListResponse = z.infer<typeof ChildrenListResponse>;
export type PlansListResponse = z.infer<typeof PlansListResponse>;
export type SubscriptionsListResponse = z.infer<
  typeof SubscriptionsListResponse
>;
export type EventsListResponse = z.infer<typeof EventsListResponse>;
export type ClassesListResponse = z.infer<typeof ClassesListResponse>;
export type SchedulesListResponse = z.infer<typeof SchedulesListResponse>;

export type UpdateAdminResponse = z.infer<typeof UpdateAdminResponse>;
export type UpdateInstructorResponse = z.infer<typeof UpdateInstructorResponse>;
export type UpdatePlanResponse = z.infer<typeof UpdatePlanResponse>;
export type UpdateEventResponse = z.infer<typeof UpdateEventResponse>;
export type DeleteResponse = z.infer<typeof DeleteResponse>;
export type UpdateSubscriptionResponse = z.infer<
  typeof UpdateSubscriptionResponse
>;
export type UpdateSubscriptionToAddClassRequest = z.infer<
  typeof UpdateSubscriptionToAddClassRequest
>;
export type UpdateSubscriptionToTerminateClassRequest = z.infer<
  typeof UpdateSubscriptionToTerminateClassRequest
>;
export type ImportNormalizeResponse = z.infer<typeof ImportNormalizeResponse>;
export type ImportNormalizedDownloadParams = z.infer<
  typeof ImportNormalizedDownloadParams
>;
export type ImportExecuteRequest = z.infer<typeof ImportExecuteRequest>;
export type ImportExecuteResponse = z.infer<typeof ImportExecuteResponse>;
export type ImportExecuteErrorResponse = z.infer<
  typeof ImportExecuteErrorResponse
>;
