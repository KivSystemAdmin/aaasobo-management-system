import { prisma } from "../../prisma/prismaClient";

// Fetch all plan data.
export const getAllPlans = async () => {
  try {
    return await prisma.plan.findMany();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch plans.");
  }
};

// Fetch the number of weekly class times by ID.
export const getWeeklyClassTimes = async (id: number) => {
  try {
    return await prisma.plan.findUnique({
      where: { id },
      select: { weeklyClassTimes: true },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch weekly class times.");
  }
};
