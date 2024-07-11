import { prisma } from "../../prisma/prismaClient";

export const deleteAttendancesByChildId = async (id: number) => {
  try {
    // Delete the Child data.
    const deletedAttendances = await prisma.classAttendance.deleteMany({
      where: { childrenId: id },
    });

    return deletedAttendances;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete class attendances.");
  }
};
