import { prisma } from "../../prisma/prismaClient";

export async function getInstructorById(id: number) {
  try {
    return prisma.instructor.findUnique({
      where: { id },
      include: { instructorAvailability: true },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor.");
  }
}

export async function addInstructorAvailability(
  instructorId: number,
  instructorRecurringAvailabilityId: number | null,
  dateTime: string,
) {
  try {
    return prisma.instructorAvailability.create({
      data: {
        instructorId,
        instructorRecurringAvailabilityId,
        dateTime,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add instructor availability.");
  }
}

export async function addInstructorRecurringAvailability(
  instructorId: number,
  rrule: string,
  dateTimes: Date[],
) {
  try {
    // A transaction is used to create both recurring and individual availabilities
    await prisma.$transaction(async (tx) => {
      const recurring = await tx.instructorRecurringAvailability.create({
        data: {
          instructorId,
          rrule,
        },
      });
      await tx.instructorAvailability.createMany({
        data: dateTimes.map((dateTime) => ({
          instructorId,
          dateTime: dateTime.toISOString(),
          instructorRecurringAvailabilityId: recurring.id,
        })),
      });
      return recurring;
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add instructor recurring availability.");
  }
}

export async function deleteInstructorAvailability(
  instructorId: number,
  dateTime: string,
) {
  try {
    return prisma.instructorAvailability.delete({
      where: { instructorId_dateTime: { instructorId, dateTime } },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete instructor availability.");
  }
}

export async function deleteInstructorRecurringAvailability(
  instructorId: number,
  dateTime: string,
  createNewRRule: (rrule: string) => string,
) {
  try {
    // A transaction is used to delete both recurring and individual availabilities
    await prisma.$transaction(async (tx) => {
      const slotAvailability = await tx.instructorAvailability.findUnique({
        where: { instructorId_dateTime: { instructorId, dateTime } },
        include: { instructorRecurringAvailability: true },
      });
      if (!slotAvailability?.instructorRecurringAvailability) {
        throw new Error("Availability not found.");
      }

      const rrule = createNewRRule(
        slotAvailability.instructorRecurringAvailability.rrule,
      );
      await tx.instructorRecurringAvailability.update({
        where: { id: slotAvailability.instructorRecurringAvailability.id },
        data: { rrule },
      });
      await tx.instructorAvailability.deleteMany({
        where: {
          instructorId,
          dateTime: { gte: dateTime },
          instructorRecurringAvailabilityId:
            slotAvailability.instructorRecurringAvailability.id,
        },
      });
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete instructor recurring availability.");
  }
}
