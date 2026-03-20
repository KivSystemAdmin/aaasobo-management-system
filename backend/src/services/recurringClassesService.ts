import { prisma } from "../../prisma/prismaClient";
import { Prisma, RecurringClass, Class } from "../../generated/prisma";
import { JAPAN_TIME_DIFF, nDaysLater, nHoursBefore } from "../utils/dateUtils";

interface CreateRegularClassParams {
  instructorId: number;
  weekday: number;
  startTime: string;
  customerId: number;
  childrenIds: number[];
  subscriptionId: number;
  startDate: string;
  timezone: string;
}

interface UpdateRegularClassParams
  extends Omit<CreateRegularClassParams, "subscriptionId"> {
  recurringClassId: number;
}

export const createRegularClass = async (params: CreateRegularClassParams) => {
  return await prisma.$transaction(async (tx) => {
    return await createRecurringClass(tx, params);
  });
};

// Simple recurring class creation for subscription setup
export const createNewRecurringClass = async (
  tx: Prisma.TransactionClient,
  subscriptionId: number,
) => {
  return await tx.recurringClass.create({
    data: {
      subscriptionId: subscriptionId,
    },
  });
};

function timeStringToDate(timeString: string): Date {
  const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const [, hours, minutes] = timeMatch;
    return new Date(`1970-01-01T${hours.padStart(2, "0")}:${minutes}:00.000Z`);
  }
  throw new Error(`Invalid time format: "${timeString}". Use "HH:MM" format.`);
}

function getNextWeekdayOccurrence(
  startDate: Date,
  targetWeekday: number,
  time: string,
): Date {
  const [hours, minutes] = time.split(":").map(Number);

  const result = new Date(startDate);

  const currentWeekday = result.getUTCDay();
  const daysUntilTarget = (targetWeekday - currentWeekday + 7) % 7;

  if (daysUntilTarget === 0 && result.getUTCHours() >= hours) {
    result.setUTCDate(result.getUTCDate() + 7);
  } else {
    result.setUTCDate(result.getUTCDate() + daysUntilTarget);
  }

  result.setUTCHours(hours - JAPAN_TIME_DIFF, minutes, 0, 0);

  return result;
}

async function conflictingRegularClassExists(
  tx: Prisma.TransactionClient,
  instructorId: number,
  weekday: number,
  startTime: string,
  startDate: Date,
): Promise<boolean> {
  const [requestedHours, requestedMinutes] = startTime.split(":").map(Number);

  // Note: We assume weekday and startTime are in JST timezone.
  // The database stores startAt in UTC, so we convert to Asia/Tokyo for comparison.
  const result = await tx.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1
      FROM "RecurringClass"
      WHERE "instructorId" = ${instructorId}
        AND ("endAt" >= ${startDate} OR "endAt" IS NULL)
        AND EXTRACT(DOW FROM (("startAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tokyo')) = ${weekday}
        AND EXTRACT(HOUR FROM (("startAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tokyo')) = ${requestedHours}
        AND EXTRACT(MINUTE FROM (("startAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tokyo')) = ${requestedMinutes}
    ) as exists
  `;

  return result[0].exists;
}

function createWeeklyDates(start: Date, end: Date): Date[] {
  const dates = [];
  const current = new Date(start);

  while (current < end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 7); // Weekly recurrence
  }

  return dates;
}

export async function terminateRecurringClass(
  tx: Prisma.TransactionClient,
  recurringClassId: number,
  endDate: Date,
): Promise<RecurringClass> {
  // Set endAt to indicate termination
  const terminatedRecurringClass = await tx.recurringClass.update({
    where: { id: recurringClassId },
    data: { endAt: endDate },
  });

  const startOfEndDate = nHoursBefore(
    JAPAN_TIME_DIFF,
    new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
      ),
    ),
  );

  // Delete future classes
  await tx.class.deleteMany({
    where: {
      recurringClassId,
      dateTime: { gte: startOfEndDate },
    },
  });
  // ClassAttendance records will be cascade deleted automatically

  return terminatedRecurringClass;
}

async function findAvailableInstructorSlot(
  tx: Prisma.TransactionClient,
  instructorId: number,
  weekday: number,
  startTime: string,
  effectiveDate: Date,
) {
  return await tx.instructorSlot.findFirst({
    where: {
      weekday,
      startTime: timeStringToDate(startTime),
      schedule: {
        instructorId,
        effectiveFrom: { lte: effectiveDate },
        effectiveTo: null,
      },
    },
    include: {
      schedule: true,
    },
  });
}

async function createRecurringClass(
  tx: Prisma.TransactionClient,
  params: CreateRegularClassParams,
): Promise<{ recurringClass: RecurringClass; createdClasses: Class[] }> {
  const {
    instructorId,
    weekday,
    startTime,
    customerId,
    childrenIds,
    subscriptionId,
    startDate,
    timezone,
  } = params;

  if (timezone !== "Asia/Tokyo") {
    throw new Error("Only Asia/Tokyo timezone is supported");
  }

  const startDateObj = new Date(startDate);

  // Check if instructor is available
  const availableSlot = await findAvailableInstructorSlot(
    tx,
    instructorId,
    weekday,
    startTime,
    startDateObj,
  );

  if (!availableSlot) {
    throw new Error("Instructor is not available at the requested time slot");
  }

  // Check for conflicting regular classes
  const hasConflict = await conflictingRegularClassExists(
    tx,
    instructorId,
    weekday,
    startTime,
    startDateObj,
  );

  if (hasConflict) {
    throw new Error("Regular class already exists at this time slot");
  }

  // Calculate first occurrence for startAt
  const firstOccurrence = getNextWeekdayOccurrence(
    startDateObj,
    weekday,
    startTime,
  );

  const recurringClass = await tx.recurringClass.create({
    data: {
      instructorId,
      subscriptionId,
      startAt: firstOccurrence,
      endAt: null,
    },
  });

  await tx.recurringClassAttendance.createMany({
    data: childrenIds.map((childId) => ({
      recurringClassId: recurringClass.id,
      childrenId: childId,
    })),
  });

  // Generate dates for 3 months and create classes
  const endDate = new Date(firstOccurrence);
  endDate.setMonth(endDate.getMonth() + 3);

  const createdClasses = await createClassesUntil(tx, recurringClass, endDate, {
    customerId,
    childrenIds,
  });

  return { recurringClass, createdClasses };
}

async function createClassesUntil(
  tx: Prisma.TransactionClient,
  recurringClass: RecurringClass,
  endDate: Date,
  classParams: { customerId: number; childrenIds: number[] },
): Promise<Class[]> {
  // Generate all dates for the period
  if (!recurringClass.startAt) {
    throw new Error("RecurringClass startAt cannot be null");
  }
  // Create all classes initially with "booked" status
  if (!recurringClass.instructorId) {
    throw new Error("RecurringClass instructorId cannot be null");
  }

  const dates = createWeeklyDates(recurringClass.startAt, endDate);
  const createdClasses = await tx.class.createManyAndReturn({
    data: dates.map((dateTime, index) => ({
      instructorId: recurringClass.instructorId!,
      customerId: classParams.customerId,
      recurringClassId: recurringClass.id,
      subscriptionId: recurringClass.subscriptionId,
      dateTime,
      status: "pending" as const,
      rebookableUntil: nDaysLater(180, dateTime),
      updatedAt: new Date(),
      classCode: `${recurringClass.id}-${index}`,
    })),
  });

  // Create ClassAttendance for all created classes
  await tx.classAttendance.createMany({
    data: createdClasses
      .map((createdClass: Class) => {
        return classParams.childrenIds.map((childrenId) => ({
          classId: createdClass.id,
          childrenId,
        }));
      })
      .flat(),
  });

  // Cancel created classes that conflict with existing classes or absences
  await cancelConflictingNewClasses(tx, recurringClass.id);
  await cancelClassesDuringAbsences(tx, recurringClass.id);
  await markPendingClassesBooked(tx, recurringClass.id);

  return createdClasses;
}

async function cancelConflictingNewClasses(
  tx: Prisma.TransactionClient,
  newRecurringClassId: number,
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Class" 
    SET status = 'canceledByInstructor',
        "canceledAt" = NOW(),
        "updatedAt" = NOW()
    WHERE id IN (
      SELECT c1.id
      FROM "Class" as c1
      INNER JOIN "Class" as c2
        ON c1."recurringClassId" = ${newRecurringClassId}
        AND c1.id <> c2.id
        AND c1."dateTime" = c2."dateTime"
        AND c1."instructorId" = c2."instructorId"
        AND c2.status IN ('booked', 'rebooked', 'completed')
    )
  `;
}

async function cancelClassesDuringAbsences(
  tx: Prisma.TransactionClient,
  newRecurringClassId: number,
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Class" 
    SET status = 'canceledByInstructor',
        "canceledAt" = NOW(),
        "updatedAt" = NOW()
    WHERE id IN (
      SELECT c.id
      FROM "Class" as c
      INNER JOIN "InstructorAbsence" as absence
        ON c."recurringClassId" = ${newRecurringClassId}
        AND absence."instructorId" = c."instructorId"
        AND absence."absentAt" = c."dateTime"
    )
  `;
}

async function markPendingClassesBooked(
  tx: Prisma.TransactionClient,
  recurringClassId: number,
): Promise<void> {
  await tx.class.updateMany({
    where: {
      recurringClassId,
      status: "pending",
    },
    data: {
      status: "booked",
      updatedAt: new Date(),
    },
  });
}

export const getRegularClassById = async (recurringClassId: number) => {
  try {
    const recurringClass = await prisma.recurringClass.findUnique({
      where: { id: recurringClassId },
      include: {
        instructor: true,
        subscription: true,
        recurringClassAttendance: {
          include: {
            children: true,
          },
        },
        classes: {
          orderBy: { dateTime: "asc" },
          take: 1, // Just get the first class to derive schedule info
        },
      },
    });

    if (!recurringClass) {
      throw new Error("Recurring class not found");
    }

    return recurringClass;
  } catch (error) {
    console.error("Error getting recurring class by ID:", error);
    throw error;
  }
};

export const getRegularClassesBySubscriptionId = async (
  subscriptionId: number,
  status?: "active" | "history",
) => {
  const whereCondition = {
    subscriptionId,
    ...(status === "active" && { endAt: null }),
    ...(status === "history" && { endAt: { not: null } }),
  };

  const recurringClasses = await prisma.recurringClass.findMany({
    where: whereCondition,
    include: {
      instructor: true,
      recurringClassAttendance: { include: { children: true } },
    },
    orderBy: [{ startAt: "asc" }, { endAt: "asc" }],
  });

  return recurringClasses.map((recurringClass) => {
    const {
      id,
      startAt,
      instructorId,
      instructor,
      recurringClassAttendance,
      endAt,
    } = recurringClass;

    const childrenIds = recurringClassAttendance.map(
      (attendance) => attendance.childrenId,
    );

    const displayEndAt = endAt && new Date(endAt);
    displayEndAt?.setDate(displayEndAt.getDate() - 1);

    return {
      id,
      dateTime: startAt,
      instructorId,
      instructor,
      childrenIds,
      recurringClassAttendance,
      endAt: displayEndAt ? displayEndAt : null,
    };
  });
};

export const updateRegularClass = async (params: UpdateRegularClassParams) => {
  const {
    recurringClassId,
    instructorId,
    weekday,
    startTime,
    customerId,
    childrenIds,
    startDate,
    timezone,
  } = params;

  if (timezone !== "Asia/Tokyo") {
    throw new Error("Only Asia/Tokyo timezone is supported");
  }

  return await prisma.$transaction(async (tx) => {
    // Check if the existing recurring class exists
    const existingRecurringClass = await tx.recurringClass.findFirst({
      where: { id: recurringClassId },
    });

    if (!existingRecurringClass) {
      throw new Error("Regular class not found");
    }

    if (!existingRecurringClass.subscriptionId) {
      throw new Error("Existing recurring class has no subscription ID");
    }

    // Validate that the start date is at least one week from now
    const startDateObj = new Date(startDate);
    const inOneWeek = nDaysLater(7);
    inOneWeek.setUTCHours(0, 0, 0, 0);
    if (startDateObj < inOneWeek) {
      throw new Error("Start date must be at least one week from today");
    }

    // Calculate the exact start time for the new recurring class
    const firstOccurrence = getNextWeekdayOccurrence(
      startDateObj,
      weekday,
      startTime,
    );

    // Step 1: Terminate the existing recurring class
    const terminatedRecurringClass = await terminateRecurringClass(
      tx,
      recurringClassId,
      firstOccurrence,
    );

    // Step 2: Create the new recurring class
    // Use the subscriptionId from the existing recurring class
    const createParams = {
      instructorId,
      weekday,
      startTime,
      customerId,
      childrenIds,
      subscriptionId: existingRecurringClass.subscriptionId,
      startDate,
      timezone,
    };

    const { recurringClass: newRecurringClass, createdClasses } =
      await createRecurringClass(tx, createParams);

    return {
      oldRecurringClass: terminatedRecurringClass,
      newRecurringClass,
      createdClasses,
    };
  });
};

// Fetch recurring classes After endAt or endAt is null
export const getValidRecurringClasses = async (
  tx: Prisma.TransactionClient,
  date: Date,
) => {
  try {
    const recurringClasses = await tx.recurringClass.findMany({
      where: { OR: [{ endAt: { gte: date } }, { endAt: null }] },
      include: { subscription: true, recurringClassAttendance: true },
    });

    return recurringClasses;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch recurring classes.");
  }
};

// Fetch recurring classes After endAt or endAt is null by instructor id
export const getValidRecurringClassesByInstructorId = async (
  instructorId: number,
  date: Date,
) => {
  try {
    const recurringClasses = await prisma.recurringClass.findMany({
      where: { instructorId, OR: [{ endAt: { gte: date } }, { endAt: null }] },
    });

    return recurringClasses;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch recurring classes.");
  }
};

// Get subscription by recurring class ID
export const getSubscriptionByRecurringClassId = async (
  recurringClassId: number,
) => {
  try {
    const recurringClass = await prisma.recurringClass.findUnique({
      where: { id: recurringClassId },
      include: {
        subscription: {
          include: {
            customer: true,
            plan: true,
          },
        },
      },
    });
    return recurringClass?.subscription || null;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to get subscription by recurring class ID.");
  }
};
