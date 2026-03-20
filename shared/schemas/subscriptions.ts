import { z } from "zod";

// Parameter schemas
export const SubscriptionIdParams = z.object({
  id: z.string().regex(/^\d+$/, "Must be a valid number").transform(Number),
});

// Response schemas
export const SubscriptionResponse = z.object({
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
      englishBackground: z.number().describe("English background requirement"),
    })
    .describe("Associated plan details"),
  customer: z
    .object({
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
    })
    .describe("Associated customer details"),
});

// Delete response schemas
export const DeleteSubscriptionResponse = z.object({
  message: z.string(),
  id: z.number(),
});

// Update response schemas
export const UpdateSubscriptionResponse = z.object({
  message: z.string(),
  id: z.number(),
});

// Inferred TypeScript types
export type SubscriptionIdParams = z.infer<typeof SubscriptionIdParams>;
export type SubscriptionResponse = z.infer<typeof SubscriptionResponse>;
export type DeleteSubscriptionResponse = z.infer<
  typeof DeleteSubscriptionResponse
>;
export type UpdateSubscriptionResponse = z.infer<
  typeof UpdateSubscriptionResponse
>;
