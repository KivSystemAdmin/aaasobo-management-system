import { prisma } from "../../prisma/prismaClient";
import { MONTHS_TO_DELETE_PLANS } from "../utils/commonUtils";

// Register a new plan in the DB
export const registerPlan = async (data: {
  name: string;
  weeklyClassTimes: number;
  description: string;
  isNative: boolean;
}) => {
  await prisma.plan.create({ data });

  return;
};

// Fetch all plan data.
export const getAllPlans = async () => {
  try {
    return await prisma.plan.findMany({
      where: {
        terminationAt: null,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch plans.");
  }
};

// Fetch the number of weekly class times by ID.
export const getWeeklyClassTimes = async (id: number) => {
  try {
    return await prisma.plan.findUnique({
      where: {
        id,
        terminationAt: null,
      },
      select: { weeklyClassTimes: true },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch weekly class times.");
  }
};

// Fetch the plan using the ID
export async function getPlanById(id: number) {
  try {
    return prisma.plan.findUnique({
      where: {
        id,
        terminationAt: null,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch plan.");
  }
}

// Update the selected plan
export const updatePlan = async (
  id: number,
  name: string,
  description: string,
  isNative: boolean,
) => {
  try {
    // Update the plan data.
    const plan = await prisma.plan.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        isNative,
      },
    });
    return plan;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the plan data.");
  }
};

// Delete the selected plan
// Technically, the record is not deleted at this time. Only terminationAt datetime is set.
export const deletePlan = async (id: number) => {
  const now = new Date();
  try {
    // Delete the plan data.
    const plan = await prisma.plan.update({
      where: {
        id,
      },
      data: {
        terminationAt: now,
      },
    });
    return plan;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete the plan data.");
  }
};

// Delete unnecessary plans
export const deleteUnnecessaryPlans = async () => {
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - MONTHS_TO_DELETE_PLANS);

  return await prisma.plan.deleteMany({
    where: {
      terminationAt: {
        lt: thresholdDate,
      },
    },
  });
};
