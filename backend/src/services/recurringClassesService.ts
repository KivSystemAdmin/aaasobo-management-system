import { prisma } from "../../prisma/prismaClient";

// Create a new recurring class in the DB
export const addRecurringClass = async (
  instructorId: number,
  customerId: number,
  childrenIds: number[],
  subscriptionId: number,
  startAt: Date,
  dateTimes: Date[],
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // Add the regular class to the RecurringClass table.
      const recurring = await tx.recurringClass.create({
        data: {
          instructorId,
          subscriptionId,
          startAt,
        },
      });
      // Add the classes to the Class table based on the Recurring Class ID.
      const createdClasses = await tx.class.createManyAndReturn({
        data: dateTimes.map((dateTime) => ({
          instructorId,
          customerId,
          recurringClassId: recurring.id,
          subscriptionId,
          dateTime: dateTime.toISOString(),
          status: "booked",
        })),
      });
      // Add the Class Attendance to the ClassAttendance Table based on the Class ID.
      await tx.classAttendance.createMany({
        data: createdClasses
          .map((createdClass) => {
            return childrenIds.map((childrenId) => ({
              classId: createdClass.id,
              childrenId,
            }));
          })
          .flat(),
      });
      // Add the children with recurring class to the RecurringClassAttendance table.
      await tx.recurringClassAttendance.createMany({
        data: childrenIds.map((childrenId) => ({
          recurringClassId: recurring.id,
          childrenId,
        })),
      });
      return recurring;
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add recurring class.");
  }
};

// Fetch recurring classes by customer id along with related instructors and customers data
export const getRecurringClassesBySubscriptionId = async (
  subscriptionId: number,
) => {
  try {
    const recurringClasses = await prisma.recurringClass.findMany({
      where: { subscriptionId },
      include: {
        subscription: {
          include: {
            customer: true,
            plan: true,
          },
        },
        instructor: true,
        recurringClassAttendance: { include: { children: true } },
      },
    });

    return recurringClasses;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch recurring classes.");
  }
};

// Update the end date to the recurring class.
export const terminateRecurringClass = async (
  recurringClassId: number,
  endAt: Date,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // Update the endAt to the RecurringClass table.
      const recurringClass = await tx.recurringClass.update({
        where: { id: recurringClassId },
        data: {
          endAt,
        },
      });

      // Fetch the classes to be deleted based on recurring class id and startAt.
      const classesToDelete = await tx.class.findMany({
        where: {
          recurringClassId,
          dateTime: {
            gt: endAt,
          },
        },
        select: { id: true },
      });

      const classIdsToDelete = classesToDelete.map((classObj) => classObj.id);

      // Delete class attendance associated with the class IDs.
      await tx.classAttendance.deleteMany({
        where: { classId: { in: classIdsToDelete } },
      });

      // Delete the classes themselves.
      await tx.class.deleteMany({
        where: { id: { in: classIdsToDelete } },
      });

      return recurringClass;
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the end date to recurring class.");
  }
};
