import { z } from "zod";

// Parameter schemas
export const ClassIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Class ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

// Request body schemas
export const RebookClassRequest = z.object({
  dateTime: z.string().min(1, "Date time is required"),
  instructorId: z
    .number()
    .int()
    .positive("Instructor ID must be a positive integer"),
  customerId: z
    .number()
    .int()
    .positive("Customer ID must be a positive integer"),
  childrenIds: z
    .array(z.number().int().positive())
    .min(1, "At least one child ID is required"),
});

export const CreateClassesForMonthRequest = z.object({
  year: z
    .number()
    .int()
    .min(2000)
    .max(3000, "Year must be between 2000 and 3000"),
  month: z.enum(
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    { message: "Month must be a valid month name" },
  ),
});

export const CheckDoubleBookingRequest = z.object({
  customerId: z
    .number()
    .int()
    .positive("Customer ID must be a positive integer"),
  dateTime: z
    .string()
    .min(1, "Date time is required")
    .transform((val) => new Date(val)),
});

export const CheckChildConflictsRequest = z.object({
  dateTime: z.string().min(1, "Date time is required"),
  selectedChildrenIds: z
    .array(z.number().int().positive())
    .min(1, "At least one child ID is required"),
});

export const CancelClassesRequest = z.object({
  classIds: z
    .array(z.number().int().positive())
    .min(1, "At least one class ID is required"),
});

export const UpdateAttendanceRequest = z.object({
  childrenIds: z.array(z.number().int().positive()),
});

export const UpdateClassStatusRequest = z.object({
  status: z.enum(
    [
      "booked",
      "completed",
      "canceledByCustomer",
      "canceledByInstructor",
      "canceledByAdmin",
      "pending",
      "rebooked",
      "declined",
    ],
    { message: "Status must be a valid class status" },
  ),
});

// Response schemas
export const ClassProfile = z
  .object({
    id: z.number(),
    dateTime: z.string(),
    customer: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    }),
    instructor: z
      .object({
        id: z.number().optional(),
        name: z.string().optional(),
        icon: z.string().optional(),
        classURL: z.string().optional(),
        nickname: z.string().optional(),
        meetingId: z.string().optional(),
        passcode: z.string().optional(),
      })
      .optional(),
    status: z.string(),
    recurringClassId: z.number().nullable().optional(),
    rebookableUntil: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    classCode: z.string().optional(),
    classAttendance: z
      .object({
        children: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
          }),
        ),
      })
      .optional(),
  })
  .passthrough();

export const AllClassesResponse = z.object({
  classes: z.array(ClassProfile),
});

export const ClassesByCustomerResponse = z.object({
  classes: z.array(ClassProfile),
});

export const CreateClassesResponse = z.object({
  result: z.array(
    z.object({
      id: z.number(),
      instructorId: z.number().nullable(),
      startAt: z.string().nullable(),
      endAt: z.string().nullable(),
      subscriptionId: z.number().nullable(),
      subscription: z
        .object({
          id: z.number(),
          customerId: z.number(),
        })
        .nullable(),
      recurringClassAttendance: z.array(
        z.object({
          childrenId: z.number(),
        }),
      ),
    }),
  ),
});

export const CheckDoubleBookingResponse = z.boolean();

export const CheckChildConflictsResponse = z.array(z.string());

export const DeleteClassResponse = z.object({
  id: z.number(),
  dateTime: z.string().nullable(),
  instructorId: z.number().nullable(),
  customerId: z.number(),
  status: z.enum([
    "booked",
    "completed",
    "canceledByCustomer",
    "canceledByInstructor",
    "canceledByAdmin",
    "pending",
    "rebooked",
    "declined",
  ]),
  rebookableUntil: z.string().nullable(),
  classCode: z.string(),
  updatedAt: z.string(),
  isFreeTrial: z.boolean(),
  subscriptionId: z.number().nullable(),
  recurringClassId: z.number().nullable(),
});

// Error responses for business logic
export const RebookClassErrorResponse = z.object({
  errorType: z.union([
    z.literal("missing parameters"),
    z.literal("invalid class data"),
    z.literal("past rebooking deadline"),
    z.literal("no subscription"),
    z.literal("outdated subscription"),
    z.literal("instructor conflict"),
    z.literal("instructor unavailable"),
  ]),
});

export const ValidationErrorResponse = z.object({
  message: z.string(),
  details: z.array(
    z.object({
      code: z.string(),
      path: z.array(z.union([z.string(), z.number()])),
      message: z.string(),
    }),
  ),
});

// Export inferred types
export type ClassIdParams = z.infer<typeof ClassIdParams>;
export type RebookClassRequest = z.infer<typeof RebookClassRequest>;
export type CreateClassesForMonthRequest = z.infer<
  typeof CreateClassesForMonthRequest
>;
export type CheckDoubleBookingRequest = z.infer<
  typeof CheckDoubleBookingRequest
>;
export type CheckChildConflictsRequest = z.infer<
  typeof CheckChildConflictsRequest
>;
export type CancelClassesRequest = z.infer<typeof CancelClassesRequest>;
export type UpdateAttendanceRequest = z.infer<typeof UpdateAttendanceRequest>;
export type UpdateClassStatusRequest = z.infer<typeof UpdateClassStatusRequest>;

export type ClassProfile = z.infer<typeof ClassProfile>;
export type AllClassesResponse = z.infer<typeof AllClassesResponse>;
export type ClassesByCustomerResponse = z.infer<
  typeof ClassesByCustomerResponse
>;
export type CreateClassesResponse = z.infer<typeof CreateClassesResponse>;
export type CheckDoubleBookingResponse = z.infer<
  typeof CheckDoubleBookingResponse
>;
export type CheckChildConflictsResponse = z.infer<
  typeof CheckChildConflictsResponse
>;
export type DeleteClassResponse = z.infer<typeof DeleteClassResponse>;
export type RebookClassErrorResponse = z.infer<typeof RebookClassErrorResponse>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponse>;
