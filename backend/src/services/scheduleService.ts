import { Prisma } from "../../generated/prisma";
import { prisma } from "../../prisma/prismaClient";
import { MONTHS_TO_DELETE_BUSINESS_CALENDAR } from "../utils/commonUtils";

// Fetch all schedules
export const getAllSchedules = async () => {
  try {
    return await prisma.schedule.findMany({
      orderBy: {
        date: "asc",
      },
      include: {
        event: true,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch schedules.");
  }
};

// Register selected schedules
export const registerSchedules = async (
  dataList: { date: string; eventId: number }[],
  tx?: Prisma.TransactionClient,
) => {
  // If no transaction client is provided, the default Prisma client will be used
  if (!tx) {
    tx = prisma;
  }

  try {
    return await tx.schedule.createMany({
      data: dataList,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to register schedules.");
  }
};

// Update selected schedules
export const updateSchedules = async (
  startDate: string,
  endDate: string,
  eventId: number,
  tx: Prisma.TransactionClient,
) => {
  try {
    return await tx.schedule.updateMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      data: {
        eventId: eventId,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update schedules.");
  }
};

// Delete classes older than 1 year (13 months)
export const deleteOldBusinessCalendar = async () => {
  const thresholdDate = new Date();
  thresholdDate.setMonth(
    thresholdDate.getMonth() - MONTHS_TO_DELETE_BUSINESS_CALENDAR,
  );

  return await prisma.schedule.deleteMany({
    where: {
      date: {
        lt: thresholdDate,
      },
    },
  });
};

// Fetch schedules by id
export const getSchedulesByEventIdAndDate = async (
  eventId: number,
  start: Date,
  end: Date,
) => {
  try {
    return await prisma.schedule.findMany({
      where: {
        eventId,
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        date: "asc",
      },
      include: {
        event: true,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch schedules.");
  }
};
