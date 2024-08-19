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
      include: { instructorAvailability: true, instructorUnavailability: true },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor.");
  }
}

export async function addInstructorRecurringAvailability(
  instructorId: number,
  startAt: Date,
  tx: Prisma.TransactionClient = prisma,
) {
  try {
    await tx.instructorRecurringAvailability.create({
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

// Fetch the instructor by the email
export const getInstructorByEmail = async (email: string) => {
  try {
    return await prisma.instructor.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor.");
  }
};

export async function getInstructorWithRecurringAvailabilityDay(
  instructorId: number,
  tx: Prisma.TransactionClient,
) {
  try {
    // Prisma doesnt' suppport EXTRACT function, so $queryRaw is used.
    return await tx.$queryRaw`
        SELECT
          *,
          to_char("startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'Dy') AS day,
          LPAD(EXTRACT(HOUR FROM "startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::TEXT, 2, '0')
            || ':'
            || LPAD(EXTRACT(MINUTE FROM "startAt")::TEXT, 2, '0') as time
        FROM
          "InstructorRecurringAvailability"
        WHERE "instructorId" = ${instructorId}
      `;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch recurring availabilities.");
  }
}

export async function terminateRecurringAvailability(
  instructorId: number,
  instructorRecurringAvailabilityId: number,
  endAt: Date,
  tx: Prisma.TransactionClient,
) {
  try {
    const availabilitiesToDelete = await tx.instructorAvailability.findMany({
      where: {
        instructorRecurringAvailabilityId,
        dateTime: { gt: endAt },
      },
    });

    const associatedClass = await tx.class.findFirst({
      where: {
        instructorId,
        dateTime: { in: availabilitiesToDelete.map((slot) => slot.dateTime) },
      },
    });
    if (associatedClass) {
      // TODO: Consider how to handle conflicts.
      // e.g., set the status of the class to "canceledByInstructor".
      throw Error(
        "Cannot delete a recurring availability with associated class.",
      );
    }

    await tx.instructorAvailability.deleteMany({
      where: {
        instructorRecurringAvailabilityId,
        dateTime: { gt: endAt },
      },
    });

    await tx.instructorRecurringAvailability.update({
      where: { id: instructorRecurringAvailabilityId },
      data: { endAt },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to terminate recurring availability.");
  }
}

export async function updateRecurringAvailabilityInterval(
  instructorRecurringAvailabilityId: number,
  startAt: Date,
  endAt: Date | null,
  tx: Prisma.TransactionClient,
) {
  try {
    await tx.instructorRecurringAvailability.update({
      where: { id: instructorRecurringAvailabilityId },
      data: { startAt, endAt },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error(
      "Failed to update instructor recurring availability interval.",
    );
  }
}

export async function getUnavailabilities(instructorId: number) {
  try {
    return await prisma.instructorUnavailability.findMany({
      where: { instructorId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor unavailabilities.");
  }
}
