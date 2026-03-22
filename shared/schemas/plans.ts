import { z } from "zod";

// Parameter schemas
export const PlanIdParams = z.object({
  id: z.string().regex(/^\d+$/, "Must be a valid number").transform(Number),
});

// Response schemas
export const PlanResponse = z.object({
  plan: z.object({
    id: z.number().describe("Plan ID"),
    name: z.string().describe("Plan name"),
    weeklyClassTimes: z.number().describe("Number of weekly class times"),
    description: z.string().describe("Plan description"),
    englishBackground: z.number().describe("English background requirement"),
  }),
});

export const PlansListResponse = z.object({
  data: z.array(
    z.object({
      id: z.number().describe("Plan ID"),
      name: z.string().describe("Plan name"),
      weeklyClassTimes: z.number().describe("Number of weekly class times"),
      description: z.string().describe("Plan description"),
      createdAt: z.iso.datetime().describe("Creation timestamp"),
      updatedAt: z.iso.datetime().describe("Last update timestamp"),
      terminationAt: z.iso
        .datetime()
        .nullable()
        .describe("Termination timestamp"),
      englishBackground: z.number().describe("English background requirement"),
    }),
  ),
});

// Inferred TypeScript types
export type PlanIdParams = z.infer<typeof PlanIdParams>;

// Response types
export type PlanResponse = z.infer<typeof PlanResponse>;
export type PlansListResponse = z.infer<typeof PlansListResponse>;
