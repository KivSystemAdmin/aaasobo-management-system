import { prisma } from "../../prisma/prismaClient";
import { Prisma } from "@prisma/client";

// Create a new instructor account in the DB
export const createInstructor = async (instructorData: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    return await prisma.instructor.create({
      data: instructorData,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique Constraint Violation
      if (error.code === "P2002") {
        throw new Error("Email is already registered");
      } else {
        console.error("Database Error:", error);
        throw new Error("Failed to register instructor");
      }
    }
  }
};

// Fetch all instructors information
export const getAllInstructors = async () => {
  try {
    return await prisma.instructor.findMany();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructors.");
  }
};

// Fetch all the availabilities of the instructors
export const getAllInstructorsAvailabilities = async () => {
  try {
    return await prisma.instructor.findMany({
      include: { instructorAvailability: true },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructors' availabilities.");
  }
};

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
  dateTime: string
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
  dateTimes: Date[]
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
  dateTime: string
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
  createNewRRule: (rrule: string) => string
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
        slotAvailability.instructorRecurringAvailability.rrule
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

export async function getActiveRecurringAvailabilities(instructorId: number) {
  try {
    return await prisma.instructorRecurringAvailability.findMany({
      where: {
        instructorId,
        rrule: { not: { contains: "UNTIL" } },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch recurring availabilities.");
  }
}

export async function insertInstructorAvailabilityIfNotExist(
  instructorId: number,
  dateTime: Date,
  instructorRecurringAvailabilityId: number,
) {
  const data = {
    instructorId,
    dateTime,
    instructorRecurringAvailabilityId,
  };
  try {
    return await prisma.instructorAvailability.upsert({
      where: { instructorId_dateTime: { instructorId, dateTime } },
      update: data,
      create: data,
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to insert instructor availability.");
  }
}
