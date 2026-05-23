import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const checkIfChildHasCompletedClass = async (
  childId: number,
): Promise<boolean> => {
  const completedClass = await prisma.classAttendance.findFirst({
    where: { childrenId: childId, class: { status: "completed" } },
  });

  return completedClass !== null;
};

export const checkIfChildHasBookedClass = async (
  childId: number,
): Promise<boolean> => {
  const bookedClass = await prisma.classAttendance.findFirst({
    where: {
      childrenId: childId,
      class: {
        status: {
          in: ["booked", "rebooked"],
        },
      },
    },
  });

  return bookedClass !== null;
};

export const deleteAttendancesByChildId = async (
  tx: Prisma.TransactionClient,
  childId: number,
) => {
  const deletedAttendances = await tx.classAttendance.deleteMany({
    where: { childrenId: childId },
  });

  return deletedAttendances;
};

export const deleteAttendancesByClassId = async (
  classId: number,
  tx?: Prisma.TransactionClient,
) => {
  const db = tx ?? prisma;
  await db.classAttendance.deleteMany({
    where: { classId },
  });
};

export const createAttendances = async (
  classId: number,
  childrenIds: number[],
  tx: Prisma.TransactionClient,
) => {
  await tx.classAttendance.createMany({
    data: childrenIds.map((childId) => ({
      classId,
      childrenId: childId,
    })),
  });
};
