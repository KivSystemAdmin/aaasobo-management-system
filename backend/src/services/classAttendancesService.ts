import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const deleteAttendancesByChildId = async (
  tx: Prisma.TransactionClient,
  childId: number
) => {
  try {
    // Delete the Child data.
    const deletedAttendances = await tx.classAttendance.deleteMany({
      where: { childrenId: childId },
    });

    return deletedAttendances;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete class attendances.");
  }
};
