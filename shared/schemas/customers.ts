import { z } from "zod";
import { ErrorResponse } from "./common";
import { SubscriptionResponse } from "./subscriptions";

// Parameter schemas
export const CustomerIdParams = z.object({
  id: z.string().regex(/^\d+$/, "Must be a valid number").transform(Number),
});

// Request body schemas
export const RegisterCustomerRequest = z.object({
  customerData: z.object({
    name: z.string().min(1).describe("Customer's full name"),
    email: z.email().describe("Customer's email address"),
    password: z.string().min(1).describe("Customer's password"),
    prefecture: z.string().min(1).describe("Customer's prefecture"),
  }),
  childData: z.object({
    name: z.string().min(1).describe("Child's full name"),
    birthdate: z.string().min(1).describe("Child's birthdate"),
    personalInfo: z.string().min(1).describe("Child's personal information"),
  }),
});

export const UpdateCustomerProfileRequest = z.object({
  name: z.string().min(1).describe("Updated customer name"),
  email: z.email().describe("Updated customer email"),
  prefecture: z.string().min(1).describe("Updated customer prefecture"),
});

export const RegisterSubscriptionRequest = z.object({
  planId: z.number().int().positive().describe("Plan ID for the subscription"),
  startAt: z.string().describe("Subscription start date"),
  selectType: z.string().describe("SelectType URL"),
});

export const VerifyEmailRequest = z.object({
  token: z.string().min(1).describe("Email verification token"),
});

export const CheckEmailConflictsRequest = z.object({
  email: z.email().describe("Email address to check for conflicts"),
});

export const DeclineFreeTrialRequest = z.object({
  classCode: z
    .string()
    .min(1)
    .optional()
    .describe("Class code for the free trial to decline"),
});

// Response schemas
export const SubscriptionsResponse = z.object({
  subscriptions: z
    .array(
      z.object({
        id: z.number().describe("Subscription ID"),
        planId: z.number().describe("Plan ID"),
        customerId: z.number().describe("Customer ID"),
        startAt: z.iso.datetime().describe("Subscription start date"),
        endAt: z.iso.datetime().nullable().describe("Subscription end date"),
        plan: z
          .object({
            id: z.number().describe("Plan ID"),
            name: z.string().describe("Plan name"),
            weeklyClassTimes: z.number().describe("Weekly class times"),
            description: z.string().describe("Plan description"),
            createdAt: z.iso.datetime().describe("Plan creation date"),
            updatedAt: z.iso.datetime().describe("Plan last update date"),
            terminationAt: z.iso
              .datetime()
              .nullable()
              .describe("Plan termination date"),
            isNative: z.boolean().describe("If it's a native plan or not"),
          })
          .describe("Associated plan details"),
      }),
    )
    .describe("List of customer subscriptions"),
});

export const CustomerProfileResponse = z.object({
  id: z.number().describe("Customer ID"),
  name: z.string().describe("Customer name"),
  email: z.email().describe("Customer email"),
  prefecture: z.string().describe("Customer prefecture"),
  emailVerified: z.iso
    .datetime()
    .nullable()
    .describe("Email verification date"),
  hasSeenWelcome: z
    .boolean()
    .describe("Whether customer has seen welcome message"),
});

export const UpdateProfileResponse = z.object({
  isEmailUpdated: z.boolean().describe("Whether email was updated"),
});

export const NewSubscriptionResponse = z.object({
  newSubscription: z.object({
    id: z.number().describe("Subscription ID"),
    planId: z.number().describe("Plan ID"),
    customerId: z.number().describe("Customer ID"),
    startAt: z.iso.datetime().describe("Subscription start date"),
  }),
});

export const RebookableClassesResponse = z
  .array(
    z.object({
      id: z.number().describe("Class ID"),
      rebookableUntil: z.iso
        .datetime()
        .nullable()
        .describe("Rebookable until date"),
      classCode: z.string().describe("Class code"),
      isFreeTrial: z.boolean().describe("Whether this is a free trial class"),
      subscription: SubscriptionResponse.nullable(),
    }),
  )
  .describe("List of rebookable classes");

export const UpcomingClassesResponse = z
  .array(
    z.object({
      id: z.number().describe("Class ID"),
      dateTime: z.iso.datetime().describe("Class date and time"),
      instructor: z
        .object({
          nickname: z.string().describe("Instructor nickname"),
          icon: z.string().describe("Instructor icon"),
        })
        .nullable()
        .describe("Instructor details"),
      attendingChildren: z
        .array(z.string())
        .describe("Names of attending children"),
    }),
  )
  .describe("List of upcoming classes");

export const CustomerClassesResponse = z
  .array(
    z.object({
      classId: z.number().describe("Class ID"),
      start: z.iso.datetime().describe("Class start time"),
      end: z.string().describe("Class end time"),
      title: z.string().describe("Class title (children names)"),
      color: z.string().describe("Class color code"),
      instructorIcon: z.string().describe("Instructor icon"),
      instructorNickname: z.string().describe("Instructor nickname"),
      instructorName: z.string().describe("Instructor name"),
      instructorClassURL: z.string().describe("Instructor class URL"),
      instructorMeetingId: z.string().describe("Instructor meeting ID"),
      instructorPasscode: z.string().describe("Instructor passcode"),
      classStatus: z.string().describe("Class status"),
      rebookableUntil: z.iso
        .datetime()
        .nullable()
        .describe("Rebookable until date"),
      classCode: z.string().describe("Class code"),
      updatedAt: z.iso.datetime().describe("Last updated date"),
      isFreeTrial: z.boolean().describe("Whether this is a free trial class"),
    }),
  )
  .describe("List of customer classes");

export const ChildProfilesResponse = z
  .array(
    z.object({
      id: z.number().describe("Child ID"),
      name: z.string().describe("Child name"),
      birthdate: z.iso.datetime().describe("Child birthdate"),
      personalInfo: z.string().describe("Child personal information"),
    }),
  )
  .describe("List of child profiles");

// Inferred TypeScript types
export type CustomerIdParams = z.infer<typeof CustomerIdParams>;
export type RegisterCustomerRequest = z.infer<typeof RegisterCustomerRequest>;
export type UpdateCustomerProfileRequest = z.infer<
  typeof UpdateCustomerProfileRequest
>;
export type RegisterSubscriptionRequest = z.infer<
  typeof RegisterSubscriptionRequest
>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequest>;
export type CheckEmailConflictsRequest = z.infer<
  typeof CheckEmailConflictsRequest
>;
export type DeclineFreeTrialRequest = z.infer<typeof DeclineFreeTrialRequest>;

// Response types
export type SubscriptionsResponse = z.infer<typeof SubscriptionsResponse>;
export type CustomerProfileResponse = z.infer<typeof CustomerProfileResponse>;
export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponse>;
export type NewSubscriptionResponse = z.infer<typeof NewSubscriptionResponse>;
export type RebookableClassesResponse = z.infer<
  typeof RebookableClassesResponse
>;
export type UpcomingClassesResponse = z.infer<typeof UpcomingClassesResponse>;
export type CustomerClassesResponse = z.infer<typeof CustomerClassesResponse>;
export type ChildProfilesResponse = z.infer<typeof ChildProfilesResponse>;
