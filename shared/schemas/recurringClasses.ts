import { z } from "zod";

// Parameter schemas
export const RecurringClassIdParams = z.object({
  id: z.string().regex(/^\d+$/, "Must be a valid number").transform(Number),
});

// Query schemas
export const GetRecurringClassesBySubscriptionQuery = z.object({
  subscriptionId: z
    .string()
    .regex(/^\d+$/, "Subscription ID must be a valid number")
    .transform(Number),
  status: z.enum(["active", "history"]).optional(),
});

export const GetRecurringClassesByInstructorQuery = z.object({
  instructorId: z
    .string()
    .regex(/^\d+$/, "Instructor ID must be a valid number")
    .transform(Number),
});

export const GetRecurringClassesHistoryCountQuery = z.object({
  subscriptionId: z
    .string()
    .regex(/^\d+$/, "Subscription ID must be a valid number")
    .transform(Number),
});

// Request body schemas
export const CreateRecurringClassRequest = z.object({
  instructorId: z
    .number()
    .int()
    .positive("Instructor ID must be a positive integer"),
  weekday: z
    .number()
    .int()
    .min(0, "Weekday must be between 0-6")
    .max(6, "Weekday must be between 0-6"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format. Use HH:mm"),
  customerId: z
    .number()
    .int()
    .positive("Customer ID must be a positive integer"),
  childrenIds: z
    .array(z.number().int().positive())
    .min(1, "At least one child ID is required"),
  subscriptionId: z
    .number()
    .int()
    .positive("Subscription ID must be a positive integer"),
  startDate: z.string().min(1, "Start date is required"),
  timezone: z.string().default("Asia/Tokyo"),
});

export const UpdateRecurringClassRequest = z.object({
  instructorId: z
    .number()
    .int()
    .positive("Instructor ID must be a positive integer"),
  weekday: z
    .number()
    .int()
    .min(0, "Weekday must be between 0-6")
    .max(6, "Weekday must be between 0-6"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format. Use HH:mm"),
  customerId: z
    .number()
    .int()
    .positive("Customer ID must be a positive integer"),
  childrenIds: z
    .array(z.number().int().positive())
    .min(1, "At least one child ID is required"),
  startDate: z.string().min(1, "Start date is required"),
  timezone: z.string().default("Asia/Tokyo"),
});

// Response schemas
export const RecurringClassResponse = z.object({
  id: z.number(),
  subscriptionId: z.number(),
  instructorId: z.number().nullable(),
  customerId: z.number().nullable(),
  weekday: z.number().nullable(),
  startTime: z.iso.datetime().nullable(),
  startDate: z.iso.datetime().nullable(),
  endDate: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const RecurringClassesListResponse = z.object({
  recurringClasses: z.array(RecurringClassResponse),
});

export const CreateRecurringClassResponse = z.object({
  message: z.string(),
  recurringClass: RecurringClassResponse,
});

export const UpdateRecurringClassResponse = z.object({
  message: z.string(),
  oldRecurringClass: RecurringClassResponse,
  newRecurringClass: RecurringClassResponse,
});

// Inferred TypeScript types
export type RecurringClassIdParams = z.infer<typeof RecurringClassIdParams>;
export type GetRecurringClassesBySubscriptionQuery = z.infer<
  typeof GetRecurringClassesBySubscriptionQuery
>;
export type GetRecurringClassesByInstructorQuery = z.infer<
  typeof GetRecurringClassesByInstructorQuery
>;
export type GetRecurringClassesHistoryCountQuery = z.infer<
  typeof GetRecurringClassesHistoryCountQuery
>;
export type CreateRecurringClassRequest = z.infer<
  typeof CreateRecurringClassRequest
>;
export type UpdateRecurringClassRequest = z.infer<
  typeof UpdateRecurringClassRequest
>;
export type RecurringClassResponse = z.infer<typeof RecurringClassResponse>;
export type RecurringClassesListResponse = z.infer<
  typeof RecurringClassesListResponse
>;
export type CreateRecurringClassResponse = z.infer<
  typeof CreateRecurringClassResponse
>;
export type UpdateRecurringClassResponse = z.infer<
  typeof UpdateRecurringClassResponse
>;
