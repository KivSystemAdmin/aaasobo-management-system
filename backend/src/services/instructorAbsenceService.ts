import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { nHoursLater } from "../utils/dateUtils";

export class CompletedClassAbsenceConflictError extends Error {
  constructor() {
    super("Cannot add absence on a completed class slot.");
    this.name = "CompletedClassAbsenceConflictError";
  }
}

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
      const now = new Date();
      const lockKey = `instructor:${data.instructorId}:${data.absentAt.toISOString()}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const completedClass = await tx.class.findFirst({
        where: {
          instructorId: data.instructorId,
          dateTime: data.absentAt,
          status: "completed",
        },
        select: { id: true },
      });

      if (completedClass) {
        throw new CompletedClassAbsenceConflictError();
      }

      const classWhere: Prisma.ClassWhereInput = {
        instructorId: data.instructorId,
        dateTime: data.absentAt,
        status: {
          in: ["booked", "rebooked"],
        },
      };
      const rebookableUntil = nHoursLater(180 * 24, data.absentAt);

      const canceledClasses = await tx.class.findMany({
        where: classWhere,
        select: {
          id: true,
          classCode: true,
          dateTime: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.class.updateMany({
        where: classWhere,
        data: {
          status: "canceledByInstructor",
          canceledAt: now,
          rebookableUntil,
          updatedAt: now,
        },
      });

      const absence = await tx.instructorAbsence.upsert({
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

      return {
        absence,
        canceledClasses: canceledClasses.map((classItem) => ({
          id: classItem.id,
          classCode: classItem.classCode,
          dateTime: classItem.dateTime!.toISOString(),
          rebookableUntil: rebookableUntil.toISOString(),
          customer: classItem.customer,
        })),
      };
    });
  } catch (error) {
    if (error instanceof CompletedClassAbsenceConflictError) {
      throw error;
    }
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

export const getInstructorAbsencesByMonth = async (
  instructorIds: number[],
  start: Date,
  end: Date,
  tx?: Prisma.TransactionClient,
) => {
  const client = tx ?? prisma;
  try {
    return await client.instructorAbsence.findMany({
      where: {
        instructorId: { in: instructorIds },
        absentAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { absentAt: "asc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor absences.");
  }
};
