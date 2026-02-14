import { prisma } from "../../prisma/prismaClient";
import { nHoursLater } from "../utils/dateUtils";

export const getInstructorAbsences = async (instructorId: number) => {
  try {
    return await prisma.instructorAbsence.findMany({
      where: { instructorId },
      orderBy: { absentAt: "asc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor absences.");
  }
};

export const addInstructorAbsence = async (data: {
  instructorId: number;
  absentAt: Date;
}) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const lockKey = `instructor:${data.instructorId}:${data.absentAt.toISOString()}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      await tx.class.updateMany({
        where: {
          instructorId: data.instructorId,
          dateTime: data.absentAt,
          status: {
            in: ["booked", "rebooked"],
          },
        },
        data: {
          status: "canceledByInstructor",
          rebookableUntil: nHoursLater(180 * 24, data.absentAt),
        },
      });

      return await tx.instructorAbsence.upsert({
        where: {
          instructorId_absentAt: {
            instructorId: data.instructorId,
            absentAt: data.absentAt,
          },
        },
        create: {
          instructorId: data.instructorId,
          absentAt: data.absentAt,
        },
        update: {},
      });
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add instructor absence.");
  }
};

export const removeInstructorAbsence = async (
  instructorId: number,
  absentAt: Date,
) => {
  try {
    return await prisma.instructorAbsence.delete({
      where: {
        instructorId_absentAt: {
          instructorId,
          absentAt,
        },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to remove instructor absence.");
  }
};
