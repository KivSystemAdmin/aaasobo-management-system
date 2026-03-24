import { z } from "zod";

export const InstructorIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Instructor ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

export const ClassIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Class ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

export const EnglishBackgroundParams = z.object({
  englishBackground: z
    .string()
    .regex(/^\d+$/, "English background must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

export const TagIdParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Tag ID must be a valid number")
    .transform((val) => parseInt(val, 10)),
});

export const UpdateInstructorTagsRequest = z.object({
  tagIds: z.array(z.number().int().positive()).default([]),
});

export const InstructorTag = z.object({
  id: z.number().int().positive(),
  label: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
});

export const InstructorTagWithCount = InstructorTag.extend({
  assignedCount: z.number().int().nonnegative(),
});

export const TagCatalogResponse = z.object({
  tags: z.array(InstructorTagWithCount),
});

export const InstructorTagsResponse = z.object({
  tags: z.array(InstructorTag),
  selectedTagIds: z.array(z.number().int().positive()),
});

// Instructor profile schema for public profiles endpoint
export const InstructorProfile = z.object({
  id: z.number().int().positive().describe("Instructor ID"),
  name: z.string().min(1).describe("Instructor full name"),
  nickname: z.string().min(1).describe("Instructor nickname"),
  icon: z.string().describe("Instructor profile icon URL from database"),
  englishBackground: z.number().describe("English background requirement"),
  tags: z.array(InstructorTag).optional(),
});

export const InstructorProfilesResponse = z
  .array(InstructorProfile)
  .describe("Array of instructor profiles");

// Detailed instructor profile schema for admin/authenticated users
export const DetailedInstructorProfile = z.object({
  id: z.number().int().positive().describe("Instructor ID"),
  name: z.string().min(1).describe("Instructor full name"),
  nickname: z.string().min(1).describe("Instructor nickname"),
  icon: z
    .object({
      url: z.string().describe("Validated instructor icon URL"),
    })
    .describe("Instructor profile icon object"),
  birthdate: z.iso.datetime().nullable().describe("Instructor birthdate"),
  lifeHistory: z.string().nullable().describe("Instructor life history"),
  favoriteFood: z.string().nullable().describe("Instructor favorite food"),
  hobby: z.string().nullable().describe("Instructor hobby"),
  messageForChildren: z.string().nullable().describe("Message for children"),
  workingTime: z.string().nullable().describe("Working time information"),
  skill: z.string().nullable().describe("Instructor skills"),
  createdAt: z.iso.datetime().describe("Created timestamp"),
  terminationAt: z.iso
    .datetime()
    .nullable()
    .describe("Termination timestamp (ISO string)"),
  englishBackground: z.number().describe("English background requirement"),
  tags: z.array(InstructorTag).optional(),
});

export const AllInstructorProfilesResponse = z
  .object({
    instructorProfiles: z.array(DetailedInstructorProfile),
  })
  .describe("Detailed instructor profiles for authenticated users");

// Complete instructor schema for individual instructor endpoint
export const CompleteInstructor = z.object({
  id: z.number().int().positive().describe("Instructor ID"),
  name: z.string().min(1).describe("Instructor full name"),
  nickname: z.string().min(1).describe("Instructor nickname"),
  email: z.email().describe("Instructor email address"),
  icon: z
    .object({
      url: z.string().describe("Validated instructor icon URL"),
    })
    .describe("Instructor profile icon object"),
  birthdate: z.iso.datetime().nullable().describe("Instructor birthdate"),
  lifeHistory: z.string().nullable().describe("Instructor life history"),
  favoriteFood: z.string().nullable().describe("Instructor favorite food"),
  hobby: z.string().nullable().describe("Instructor hobby"),
  messageForChildren: z.string().nullable().describe("Message for children"),
  workingTime: z.string().nullable().describe("Working time information"),
  skill: z.string().nullable().describe("Instructor skills"),
  classURL: z.string().nullable().describe("Class meeting URL"),
  meetingId: z.string().nullable().describe("Meeting ID"),
  passcode: z.string().nullable().describe("Meeting passcode"),
  terminationAt: z.string().nullable().describe("Termination timestamp (JST)"),
  englishBackground: z.number().describe("English background requirement"),
  tags: z.array(InstructorTag).optional(),
});

export const InstructorResponse = z
  .object({
    instructor: CompleteInstructor,
  })
  .describe("Individual instructor details");

// Simple instructor profile schema for /:id/profile endpoint
export const SimpleInstructorProfile = z
  .object({
    id: z.number().int().positive().describe("Instructor ID"),
    name: z.string().min(1).describe("Instructor full name"),
    nickname: z.string().min(1).describe("Instructor nickname"),
    createdAt: z.iso.datetime().describe("Created timestamp"),
  })
  .describe("Simple instructor profile information");

// Instructor schedule schema
export const InstructorSchedule = z
  .object({
    id: z.number().int().positive().describe("Schedule ID"),
    instructorId: z.number().int().positive().describe("Instructor ID"),
    effectiveFrom: z.iso.datetime().describe("Effective from date"),
    effectiveTo: z.iso.datetime().nullable().describe("Effective to date"),
    timezone: z.string().describe("Timezone"),
  })
  .describe("Instructor schedule information");

export const InstructorSchedulesResponse = z
  .object({
    message: z.string().describe("Success message"),
    data: z.array(InstructorSchedule).describe("Array of instructor schedules"),
  })
  .describe("Instructor schedules response");

// Class to instructor mapping response
export const ClassInstructorResponse = z
  .object({
    instructorId: z
      .number()
      .int()
      .positive()
      .describe("Instructor ID for the class"),
  })
  .describe("Class to instructor mapping");

// Active schedule query schema
export const ActiveScheduleQuery = z.object({
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Effective date must be in YYYY-MM-DD format")
    .describe("Date to check for active schedule"),
});

// Instructor slot schema
export const InstructorSlot = z.object({
  scheduleId: z.number().int().positive().describe("Schedule ID"),
  weekday: z
    .number()
    .int()
    .min(0)
    .max(6)
    .describe("Day of week (0=Sunday, 6=Saturday)"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format")
    .describe("Start time in HH:MM format"),
});

// Active schedule with slots
export const ActiveInstructorSchedule = z.object({
  id: z.number().int().positive().describe("Schedule ID"),
  instructorId: z.number().int().positive().describe("Instructor ID"),
  effectiveFrom: z.iso.datetime().describe("Effective from date"),
  effectiveTo: z.iso.datetime().nullable().describe("Effective to date"),
  timezone: z.string().describe("Timezone"),
  slots: z.array(InstructorSlot).describe("Array of instructor time slots"),
});

export const ActiveScheduleResponse = z.object({
  message: z.string().describe("Success message"),
  data: ActiveInstructorSchedule.describe(
    "Active instructor schedule with slots",
  ),
});

// Available slots schemas
export const AvailableSlotsQuery = z
  .object({
    start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .describe("Start date for slot search"),
    end: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .describe("End date for slot search"),
    timezone: z
      .literal("Asia/Tokyo")
      .describe("Timezone (currently only Asia/Tokyo is supported)"),
    englishBackground: z
      .string()
      .describe("English background requirement for filtering instructors"),
  })
  .refine(
    (data) => new Date(data.start) < new Date(data.end),
    "Start date must be before end date",
  );

export const InstructorAvailableSlotsQuery = z
  .object({
    start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .describe("Start date for slot search"),
    end: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .describe("End date for slot search"),
    timezone: z
      .literal("Asia/Tokyo")
      .describe("Timezone (currently only Asia/Tokyo is supported)"),
    excludeBookedSlots: z
      .string()
      .optional()
      .describe(
        "Optional flag to exclude booked slots ('true' to exclude, any other value to include)",
      ),
  })
  .refine(
    (data) => new Date(data.start) < new Date(data.end),
    "Start date must be before end date",
  );

// Simple slot for individual instructor queries
export const InstructorSlotTime = z.object({
  dateTime: z.string().describe("ISO datetime string for the available slot"),
});

// Slot with instructor list for multi-instructor queries
export const AvailableSlot = z.object({
  dateTime: z.string().describe("ISO datetime string for the available slot"),
  availableInstructors: z
    .array(z.number().int().positive())
    .describe("Array of instructor IDs available for this slot"),
});

export const InstructorAvailableSlotsResponse = z.object({
  message: z.string().describe("Success message"),
  data: z
    .array(InstructorSlotTime)
    .describe("Array of available time slots for the instructor"),
});

export const AvailableSlotsResponse = z.object({
  message: z.string().describe("Success message"),
  data: z
    .array(AvailableSlot)
    .describe("Array of available time slots with instructor availability"),
});

export const InstructorCalendarClass = z.object({
  classId: z.number().int().positive().describe("Class ID"),
  start: z.iso.datetime().describe("Class start time"),
  end: z.iso.datetime().describe("Class end time"),
  title: z.string().describe("Class title"),
  color: z.string().describe("Class color code"),
  classStatus: z.string().describe("Class status"),
});

export const InstructorCalendarClassesResponse = z
  .array(InstructorCalendarClass)
  .describe("Array of instructor calendar classes");

// Dual parameter schemas for complex routes
export const InstructorClassParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Instructor ID must be a valid number")
    .transform(Number),
  classId: z
    .string()
    .regex(/^\d+$/, "Class ID must be a valid number")
    .transform(Number),
});

export const InstructorScheduleParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Instructor ID must be a valid number")
    .transform(Number),
  scheduleId: z
    .string()
    .regex(/^\d+$/, "Schedule ID must be a valid number")
    .transform(Number),
});

// Create schedule request schemas
export const CreateSlotRequest = z.object({
  weekday: z
    .number()
    .int()
    .min(0)
    .max(6)
    .describe("Day of week (0=Sunday, 6=Saturday)"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format")
    .describe("Start time in HH:MM format"),
});

export const CreateScheduleRequest = z.object({
  effectiveFrom: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Effective from date must be in YYYY-MM-DD format",
    )
    .describe("Effective from date in YYYY-MM-DD format"),
  timezone: z.string().min(1).describe("Timezone (e.g., Asia/Tokyo)"),
  slots: z.array(CreateSlotRequest).min(0).describe("Array of time slots"),
});

export const CreateScheduleResponse = z.object({
  message: z.string().describe("Success message"),
  data: ActiveInstructorSchedule.describe(
    "Created instructor schedule with slots",
  ),
});

// Instructor absence schemas
export const InstructorAbsenceParams = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Instructor ID must be a valid number")
    .transform(Number),
  absentAt: z.iso.datetime().describe("Absence date in ISO format"),
});

export const CreateAbsenceRequest = z.object({
  absentAt: z.iso.datetime().describe("Absence date in ISO format"),
});

export const InstructorAbsence = z.object({
  instructorId: z.number().int().positive().describe("Instructor ID"),
  absentAt: z.string().describe("Absence date in ISO format"),
});

export const InstructorAbsencesResponse = z.object({
  message: z.string().describe("Success message"),
  data: z.array(InstructorAbsence).describe("Array of instructor absences"),
});

export const CreateAbsenceResponse = z.object({
  message: z.string().describe("Success message"),
  data: InstructorAbsence.describe("Created instructor absence"),
});

export const DeleteAbsenceResponse = z.object({
  message: z.string().describe("Success message"),
  data: InstructorAbsence.describe("Deleted instructor absence"),
});

// Post-termination schedule response
export const PostTerminationScheduleResponse = z.object({
  message: z.string().describe("Success message"),
  data: z
    .array(ActiveInstructorSchedule)
    .describe("Array of created post-termination schedules"),
});

// Type exports
export type InstructorIdParams = z.infer<typeof InstructorIdParams>;
export type ClassIdParams = z.infer<typeof ClassIdParams>;
export type EnglishBackgroundParams = z.infer<typeof EnglishBackgroundParams>;
export type TagIdParams = z.infer<typeof TagIdParams>;
export type UpdateInstructorTagsRequest = z.infer<
  typeof UpdateInstructorTagsRequest
>;
export type InstructorTag = z.infer<typeof InstructorTag>;
export type InstructorTagWithCount = z.infer<typeof InstructorTagWithCount>;
export type TagCatalogResponse = z.infer<typeof TagCatalogResponse>;
export type InstructorTagsResponse = z.infer<typeof InstructorTagsResponse>;
export type InstructorProfile = z.infer<typeof InstructorProfile>;
export type InstructorProfilesResponse = z.infer<
  typeof InstructorProfilesResponse
>;
export type DetailedInstructorProfile = z.infer<
  typeof DetailedInstructorProfile
>;
export type AllInstructorProfilesResponse = z.infer<
  typeof AllInstructorProfilesResponse
>;
export type CompleteInstructor = z.infer<typeof CompleteInstructor>;
export type InstructorResponse = z.infer<typeof InstructorResponse>;
export type SimpleInstructorProfile = z.infer<typeof SimpleInstructorProfile>;
export type InstructorSchedule = z.infer<typeof InstructorSchedule>;
export type InstructorSchedulesResponse = z.infer<
  typeof InstructorSchedulesResponse
>;
export type ClassInstructorResponse = z.infer<typeof ClassInstructorResponse>;
export type ActiveScheduleQuery = z.infer<typeof ActiveScheduleQuery>;
export type InstructorSlot = z.infer<typeof InstructorSlot>;
export type ActiveInstructorSchedule = z.infer<typeof ActiveInstructorSchedule>;
export type ActiveScheduleResponse = z.infer<typeof ActiveScheduleResponse>;
export type AvailableSlotsQuery = z.infer<typeof AvailableSlotsQuery>;
export type InstructorAvailableSlotsQuery = z.infer<
  typeof InstructorAvailableSlotsQuery
>;
export type InstructorSlotTime = z.infer<typeof InstructorSlotTime>;
export type AvailableSlot = z.infer<typeof AvailableSlot>;
export type InstructorAvailableSlotsResponse = z.infer<
  typeof InstructorAvailableSlotsResponse
>;
export type AvailableSlotsResponse = z.infer<typeof AvailableSlotsResponse>;
export type InstructorCalendarClass = z.infer<typeof InstructorCalendarClass>;
export type InstructorCalendarClassesResponse = z.infer<
  typeof InstructorCalendarClassesResponse
>;
export type InstructorClassParams = z.infer<typeof InstructorClassParams>;
export type InstructorScheduleParams = z.infer<typeof InstructorScheduleParams>;
export type CreateSlotRequest = z.infer<typeof CreateSlotRequest>;
export type CreateScheduleRequest = z.infer<typeof CreateScheduleRequest>;
export type CreateScheduleResponse = z.infer<typeof CreateScheduleResponse>;
export type InstructorAbsenceParams = z.infer<typeof InstructorAbsenceParams>;
export type CreateAbsenceRequest = z.infer<typeof CreateAbsenceRequest>;
export type InstructorAbsence = z.infer<typeof InstructorAbsence>;
export type InstructorAbsencesResponse = z.infer<
  typeof InstructorAbsencesResponse
>;
export type CreateAbsenceResponse = z.infer<typeof CreateAbsenceResponse>;
export type DeleteAbsenceResponse = z.infer<typeof DeleteAbsenceResponse>;
export type PostTerminationScheduleResponse = z.infer<
  typeof PostTerminationScheduleResponse
>;
