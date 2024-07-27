import { prisma } from "../../prisma/prismaClient";

export async function getInstructorUnavailabilities(instructorId: number) {
  try {
    return await prisma.instructorUnavailability.findMany({
      where: { instructorId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor unavailabilities.");
  }
}

export async function createInstructorUnavailability(
  instructorId: number,
  dateTime: Date,
) {
  try {
    await prisma.instructorUnavailability.create({
      data: { instructorId, dateTime },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create instructor unavailability.");
  }
}
