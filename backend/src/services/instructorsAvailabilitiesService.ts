import { prisma } from "../../prisma/prismaClient";

export const fetchInstructorAvailabilitiesTodayAndAfter = async (
  instructorId: number,
  startDate: Date,
) => {
  try {
    // Get the dateTime to exclude from the `Class` table
    const excludedFromClasses = await prisma.class.findMany({
      where: {
        instructorId: instructorId,
        dateTime: {
          gte: startDate,
        },
        status: {
          in: ["booked", "canceledByInstructor"],
        },
      },
      select: {
        dateTime: true,
      },
    });

    // Get the dateTime to exclude from the `instructorUnavailability` table
    const excludedFromUnavailability =
      await prisma.instructorUnavailability.findMany({
        where: {
          instructorId: instructorId,
          dateTime: {
            gte: startDate,
          },
        },
        select: {
          dateTime: true,
        },
      });

    // Combine the excluded dateTime
    const excludedDateTimes = [
      ...excludedFromClasses.map((record) => record.dateTime),
      ...excludedFromUnavailability.map((record) => record.dateTime),
    ];

    // Get the availabilities from the `instructorAvailability` table
    const availabilities = await prisma.instructorAvailability.findMany({
      where: {
        instructorId: instructorId,
        dateTime: {
          gte: startDate,
          notIn: excludedDateTimes, // Exclude the dateTime from the list
        },
      },
      orderBy: {
        dateTime: "asc",
      },
    });

    // Convert to an array of dateTime only
    const dateTimes = availabilities.map(
      (availability) => availability.dateTime,
    );

    return dateTimes;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor availabilities.");
  }
};
