import { z } from "zod";

// Request body schemas
export const UpdateSundayColorRequest = z.object({
  eventId: z.number().int().positive("Event ID must be a positive integer"),
});

// Response schemas
export const SystemStatusResponse = z.object({
  status: z
    .enum(["Running", "Stop"])
    .describe("Current system status (Running or Stop)"),
});

export const UpdateSystemStatusResponse = z.object({
  id: z.number().describe("System status ID"),
  status: z
    .enum(["Running", "Stop"])
    .describe("Updated system status (Running or Stop)"),
});

export const UpdateSundayColorResponse = z.object({
  message: z.string().describe("Whether the operation was successful"),
});

export const MaskInstructorsResponse = z.array(
  z.object({
    id: z.number().describe("Instructor ID"),
    name: z.string().describe("Masked instructor name"),
    email: z.string().describe("Masked instructor email"),
    password: z.string().describe("Masked instructor password"),
    birthdate: z.iso.datetime().describe("Masked birthdate"),
    workingTime: z.string().describe("Masked working time"),
    lifeHistory: z.string().describe("Masked life history"),
    favoriteFood: z.string().describe("Masked favorite food"),
    hobby: z.string().describe("Masked hobby"),
    messageForChildren: z.string().describe("Masked message for children"),
    skill: z.string().describe("Masked skill"),
    classURL: z.string().describe("Masked class URL"),
    meetingId: z.string().describe("Masked meeting ID"),
    passcode: z.string().describe("Masked passcode"),
  }),
);

export const DeleteOldClassesResponse = z.object({
  deletedClasses: z.object({
    count: z.number().describe("Number of deleted classes"),
  }),
});

export const DeletePastCustomersResponse = z.object({
  deletedCustomers: z.object({
    count: z.number().describe("Number of deleted customers"),
  }),
});

export const DeletePastInstructorsResponse = z.object({
  deletedInstructors: z.object({
    count: z.number().describe("Number of deleted instructors"),
  }),
});

export const DeleteOldBusinessCalendarResponse = z.object({
  deletedBusinessCalendar: z.object({
    count: z.number().describe("Number of deleted business calendar"),
  }),
});

export const DeleteUnnecessaryPlansResponse = z.object({
  deletedPlans: z.object({
    count: z.number().describe("Number of deleted plans"),
  }),
});

// Inferred TypeScript types
export type UpdateSundayColorRequest = z.infer<typeof UpdateSundayColorRequest>;
export type SystemStatusResponse = z.infer<typeof SystemStatusResponse>;
export type UpdateSystemStatusResponse = z.infer<
  typeof UpdateSystemStatusResponse
>;
export type UpdateSundayColorResponse = z.infer<
  typeof UpdateSundayColorResponse
>;
export type MaskInstructorsResponse = z.infer<typeof MaskInstructorsResponse>;
export type DeleteOldClassesResponse = z.infer<typeof DeleteOldClassesResponse>;
export type DeletePastCustomersResponse = z.infer<
  typeof DeletePastCustomersResponse
>;
export type DeletePastInstructorsResponse = z.infer<
  typeof DeletePastInstructorsResponse
>;
export type DeleteOldBusinessCalendarResponse = z.infer<
  typeof DeleteOldBusinessCalendarResponse
>;
export type DeleteUnnecessaryPlansResponse = z.infer<
  typeof DeleteUnnecessaryPlansResponse
>;
