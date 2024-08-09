import { prisma } from "../../prisma/prismaClient";
import { Prisma } from "@prisma/client";

// Create a new instructor account in the DB
export const createInstructor = async (instructorData: {
  name: string;
  email: string;
  password: string;
  nickname: string;
  icon: string;
  classURL: string;
  meetingId: string;
  passcode: string;
  introductionURL: string;
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
    } else {
      throw error;
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
      include: { instructorAvailability: true, instructorUnavailability: true },
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

export async function addInstructorRecurringAvailability(
  instructorId: number,
  startAt: Date,
) {
  try {
    await prisma.instructorRecurringAvailability.create({
      data: {
        instructorId,
        startAt,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add instructor recurring availability.");
  }
}

export async function getInstructorWithRecurringAvailability(
  instructorId: number,
) {
  try {
    return await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: { instructorRecurringAvailability: true },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor with recurring availability.");
  }
}

export async function getInstructorRecurringAvailabilities(
  tx: Prisma.TransactionClient,
  instructorId: number,
) {
  try {
    return tx.instructorRecurringAvailability.findMany({
      where: { instructorId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch recurring availabilities.");
  }
}

export async function addInstructorAvailabilities(
  tx: Prisma.TransactionClient,
  instructorId: number,
  recurringAvailabilities: {
    instructorRecurringAvailabilityId: number;
    dateTimes: Date[];
  }[],
) {
  try {
    const unavailabilities = await tx.instructorUnavailability.findMany({
      where: { instructorId },
    });
    const excludeDateTimes = new Set(
      unavailabilities.map(({ dateTime }) => dateTime.toISOString()),
    );

    for (const recurringAvailability of recurringAvailabilities) {
      const { instructorRecurringAvailabilityId, dateTimes } =
        recurringAvailability;
      for (const dateTime of dateTimes) {
        if (excludeDateTimes.has(dateTime.toISOString())) {
          continue;
        }
        const data = {
          instructorId,
          instructorRecurringAvailabilityId,
          dateTime,
        };
        await tx.instructorAvailability.upsert({
          where: { instructorId_dateTime: { instructorId, dateTime } },
          update: data,
          create: data,
        });
      }
    }
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add instructor availabilities.");
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

export async function fetchInstructorAvailabilities(instructorId: number) {
  try {
    const availabilities = await prisma.instructorAvailability.findMany({
      where: {
        instructorId,
      },
      select: {
        dateTime: true,
      },
    });

    const availableDateTimes = availabilities.map(
      (availability) => availability.dateTime,
    );
    return availableDateTimes;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to get instructor availabilities.");
  }
}

// Fetch recurring availability After endAt or endAt is null
export const getValidRecurringAvailabilities = async (
  instructorId: number,
  date: Date,
) => {
  try {
    const recurringAvailabilities =
      await prisma.instructorRecurringAvailability.findMany({
        where: { instructorId, OR: [{ endAt: { gt: date } }, { endAt: null }] },
      });

    return recurringAvailabilities;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor's recurring availability.");
  }
};
