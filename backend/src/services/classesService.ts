import { Prisma, Status } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { getJstDayRange, nDaysLater, nHoursLater } from "../utils/dateUtils";
import { NewClassToRebookType } from "../controllers/classesController";
import {
  FREE_TRIAL_BOOKING_HOURS,
  REGULAR_REBOOKING_HOURS,
  MONTHS_TO_DELETE_CLASSES,
} from "../utils/commonUtils";
import {
  CANCELED_CLASS_COLOR,
  COMPLETED_CLASS_COLOR,
  UPCOMING_CLASS_COLOR,
} from "../utils/colors";
import { getInstructorAvailableSlots } from "./instructorScheduleService";

type ClassListItem = {
  id: number;
  dateTime: Date | null;
  status: Status;
  recurringClassId: number | null;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  instructor: {
    id: number;
    name: string;
  } | null;
};

type CustomerClassListItem = {
  id: number;
  dateTime: Date | null;
  status: Status;
  recurringClassId: number | null;
  rebookableUntil: Date | null;
  updatedAt: Date;
  classCode: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  instructor: {
    id: number;
    name: string;
    icon: string;
    classURL: string;
    nickname: string;
    meetingId: string;
    passcode: string;
  } | null;
  classAttendance: Array<{
    children: {
      id: number;
      name: string;
    };
  }>;
};

type AdminClassPeriodListItem = {
  id: number;
  dateTime: Date | null;
  status: Status;
  classCode: string;
  isFreeTrial: boolean;
  canceledAt: Date | null;
  customer: {
    id: number;
    name: string;
  };
  instructor: {
    id: number;
    nickname: string;
  } | null;
  classAttendance: Array<{
    children: {
      name: string;
    };
  }>;
};

export class InstructorUnavailableError extends Error {
  constructor() {
    super("instructor unavailable");
  }
}

// Fetch all the classes with related instructors and customers data
export const getAllClasses = async () => {
  try {
    const classes: ClassListItem[] = await prisma.class.findMany({
      select: {
        id: true,
        dateTime: true,
        status: true,
        recurringClassId: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dateTime: "desc" },
    });

    return classes;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch classes.");
  }
};

// Fetch classes with designated dateTime range
export const getClassesWithinPeriod = async (
  startDate: Date,
  endDate: Date,
) => {
  try {
    const classes: AdminClassPeriodListItem[] = await prisma.class.findMany({
      where: {
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        dateTime: true,
        status: true,
        classCode: true,
        isFreeTrial: true,
        canceledAt: true,
        instructor: {
          select: {
            id: true,
            nickname: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        classAttendance: {
          select: {
            children: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { dateTime: "asc" },
    });

    return classes;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch classes.");
  }
};

// Fetch classes by customer id along with related instructors and customers data
export const getClassesByCustomerId = async (customerId: number) => {
  try {
    const classes: CustomerClassListItem[] = await prisma.class.findMany({
      where: { customerId },
      select: {
        id: true,
        dateTime: true,
        status: true,
        recurringClassId: true,
        rebookableUntil: true,
        updatedAt: true,
        classCode: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            icon: true,
            classURL: true,
            nickname: true,
            meetingId: true,
            passcode: true,
          },
        },
        classAttendance: {
          select: {
            children: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { dateTime: "asc" },
    });

    return classes;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch classes.");
  }
};

// Fetch class information by class id
export const getClassByClassId = async (classId: number) => {
  try {
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        instructor: true,
        customer: true,
        classAttendance: { include: { children: true } },
      },
    });

    return classInfo;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch class information.");
  }
};

// Delete a class in the DB
export const deleteClass = async (classId: number) => {
  try {
    const [_, deletedClass] = await prisma.$transaction([
      prisma.classAttendance.deleteMany({
        where: { classId },
      }),
      prisma.class.delete({
        where: { id: classId },
      }),
    ]);

    return deletedClass;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete class.");
  }
};

// Update/Edit a class
export const updateClass = async (
  id: number,
  status: Status,
  classDateTime: Date | string,
) => {
  const now = new Date();

  if (status === "canceledByInstructor" || status === "canceledByAdmin") {
    await prisma.$transaction(async (tx) => {
      await tx.class.update({
        where: { id },
        data: {
          status,
          canceledAt: now,
          updatedAt: now,
          rebookableUntil: nHoursLater(180 * 24, new Date(classDateTime)),
        },
      });

      // Commented out as we want to keep attendance records for classes canceled by instructor
      // await tx.classAttendance.deleteMany({
      //   where: { classId: id },
      // });
    });
  } else {
    await prisma.class.update({
      where: { id },
      data: {
        status,
        canceledAt: status === "canceledByCustomer" ? now : null,
        updatedAt: now,
        ...(status === "completed" && { rebookableUntil: null }),
      },
    });
  }
};

// Cancel a class
export const cancelClassById = async (classId: number) => {
  await prisma.$transaction(async (tx) => {
    const now = new Date();

    await tx.classAttendance.deleteMany({
      where: { classId },
    });

    await tx.class.update({
      where: { id: classId },
      data: {
        status: "canceledByCustomer",
        canceledAt: now,
        updatedAt: now,
      },
    });
  });
};

// Cancel classes by instructor
export const cancelClassByInstructor = async (
  tx: Prisma.TransactionClient,
  classId: number,
) => {
  const now = new Date();

  await tx.classAttendance.deleteMany({
    where: { classId },
  });

  await tx.class.update({
    where: { id: classId },
    data: {
      status: "canceledByInstructor",
      canceledAt: now,
      updatedAt: now,
    },
  });
};

export const cancelClassByAdmin = async (
  tx: Prisma.TransactionClient,
  classId: number,
  classDateTime: Date,
) => {
  const now = new Date();

  await tx.class.update({
    where: { id: classId },
    data: {
      status: "canceledByAdmin",
      canceledAt: now,
      updatedAt: now,
      rebookableUntil: nDaysLater(180, classDateTime),
    },
  });
};

// Create classes based on the recurring class id
export const createClassesUsingRecurringClassId = async (
  tx: Prisma.TransactionClient,
  recurringClassId: number,
  instructorId: number,
  customerId: number,
  subscriptionId: number,
  childrenIds: number[],
  dateTimes: Date[],
) => {
  try {
    await tx.class.createManyAndReturn({
      data: dateTimes.map((dateTime, index) => {
        return {
          recurringClassId,
          instructorId,
          customerId,
          subscriptionId,
          status: "booked",
          dateTime,
          rebookableUntil: nDaysLater(180, dateTime),
          updatedAt: new Date(),
          classCode: `${recurringClassId}-${index}`,
        };
      }),
    });

    const createdClasses = await tx.class.findMany({
      where: {
        recurringClassId,
        dateTime: { in: dateTimes },
      },
    });

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

    return createdClasses;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add classes.");
  }
};

export const getExcludedClasses = async (
  tx: Prisma.TransactionClient,
  recurringClassIds: number[],
  date: Date,
  until: Date,
) => {
  try {
    const excludedClassData = await tx.class.findMany({
      where: {
        recurringClassId: { in: recurringClassIds },
        dateTime: { gte: date, lt: until },
      },
    });

    return excludedClassData;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch classes.");
  }
};

// Check if the selected children have another class with another instructor at the same dateTime
// If there are conflicting classes, return the array of the children's names
export const checkChildConflicts = async (
  dateTime: string,
  childrenIds: number[],
) => {
  const conflictingClasses = await prisma.class.findMany({
    where: {
      dateTime,
      classAttendance: {
        some: {
          childrenId: {
            in: childrenIds,
          },
        },
      },
    },
    include: {
      classAttendance: {
        include: {
          children: true,
        },
      },
    },
  });

  // Filter out names of the selected children that have conflicts
  const conflictingChildren: string[] = [
    ...new Set(
      conflictingClasses.flatMap((eachClass) =>
        eachClass.classAttendance
          .filter((attendance) => childrenIds.includes(attendance.childrenId))
          .map((attendance) => attendance.children.name),
      ),
    ),
  ];

  return conflictingChildren;
};

// Check if there is a class that is already booked at the same dateTime as the newlly booked class
export const checkDoubleBooking = async (
  customerId: number,
  dateTime: Date,
): Promise<boolean> => {
  const alreadyBookedClass = await prisma.class.findFirst({
    where: {
      customerId,
      dateTime,
      status: {
        in: ["booked", "rebooked"],
      },
    },
  });

  // Return true if a booked class is found, otherwise false
  return alreadyBookedClass !== null;
};

export const getRebookableClasses = async (customerId: number) => {
  // Rebooking is allowed until 3 hours before rebookableUntil.
  // Free trial booking is allowed until 72 hours before rebookableUntil.

  const rebookableFrom = nHoursLater(REGULAR_REBOOKING_HOURS);
  const freeTrialBookableFrom = nHoursLater(FREE_TRIAL_BOOKING_HOURS);

  // Regular (non-free trial) classes
  const regularClasses = await prisma.class.findMany({
    where: {
      customerId,
      isFreeTrial: false,
      status: {
        in: [
          "canceledByCustomer",
          "canceledByInstructor",
          "canceledByAdmin",
          "pending",
        ],
      },
      rebookableUntil: {
        gte: rebookableFrom,
      },
    },
    include: {
      subscription: {
        include: {
          plan: true,
          customer: true,
        },
      },
    },
  });

  // Free trial classes
  const freeTrialClasses = await prisma.class.findMany({
    where: {
      customerId,
      isFreeTrial: true,
      status: {
        in: [
          "canceledByCustomer",
          "canceledByInstructor",
          "canceledByAdmin",
          "pending",
        ],
      },
      rebookableUntil: {
        gte: freeTrialBookableFrom,
      },
    },
    include: {
      subscription: {
        include: {
          plan: true,
          customer: true,
        },
      },
    },
  });

  const combinedClasses = [...regularClasses, ...freeTrialClasses].sort(
    (a, b) => a.rebookableUntil!.getTime() - b.rebookableUntil!.getTime(),
  );

  return combinedClasses.map((classItem) => ({
    id: classItem.id,
    rebookableUntil: classItem.rebookableUntil,
    classCode: classItem.classCode,
    isFreeTrial: classItem.isFreeTrial,
    subscription: classItem.subscription,
  }));
};

export const getUpcomingClasses = async (customerId: number) => {
  const nowUTC = new Date();

  const classes = await prisma.class.findMany({
    where: {
      customerId: customerId,
      status: {
        in: ["booked", "rebooked"],
      },
      dateTime: {
        gte: nowUTC,
      },
    },
    orderBy: {
      dateTime: "asc",
    },
    include: {
      instructor: {
        select: {
          nickname: true,
          icon: true,
        },
      },
      classAttendance: {
        include: {
          children: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  const upcomingClasses = classes.map((classItem) => {
    return {
      id: classItem.id,
      dateTime: classItem.dateTime,
      instructor: classItem.instructor,
      attendingChildren: classItem.classAttendance.map(
        (attendance) => attendance.children.name,
      ),
    };
  });
  return upcomingClasses;
};

export const cancelClasses = async (classIds: number[]) => {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    await tx.classAttendance.deleteMany({
      where: { classId: { in: classIds } },
    });

    await tx.class.updateMany({
      where: { id: { in: classIds } },
      data: {
        status: "canceledByCustomer",
        canceledAt: now,
        updatedAt: now,
      },
    });

    return true;
  });
};

export const getCustomerClasses = async (customerId: number) => {
  const classes = await prisma.class.findMany({
    where: {
      customerId: customerId,
      NOT: {
        status: { in: ["pending", "declined"] },
      },
    },
    orderBy: {
      dateTime: "desc",
    },
    include: {
      instructor: {
        select: {
          name: true,
          nickname: true,
          icon: true,
          classURL: true,
          meetingId: true,
          passcode: true,
        },
      },
      classAttendance: {
        include: {
          children: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // All returned classes are non-pending, so both dateTime and instructor are guaranteed to exist
  const customerClasses = classes.map((classItem) => {
    const start = classItem.dateTime!;
    const end = new Date(new Date(start).getTime() + 25 * 60000).toISOString();

    const statusColorMap: Partial<Record<Status, string>> = {
      booked: UPCOMING_CLASS_COLOR,
      rebooked: UPCOMING_CLASS_COLOR,
      canceledByCustomer: CANCELED_CLASS_COLOR,
      canceledByInstructor: CANCELED_CLASS_COLOR,
      canceledByAdmin: CANCELED_CLASS_COLOR,
      completed: COMPLETED_CLASS_COLOR,
    };

    const color = statusColorMap[classItem.status];

    const childrenNames = classItem.classAttendance
      .map((attendance) => attendance.children.name)
      .join(", ");

    return {
      classId: classItem.id,
      start,
      end,
      title: childrenNames,
      color,
      instructorIcon: classItem.instructor!.icon,
      instructorNickname: classItem.instructor!.nickname,
      instructorName: classItem.instructor!.name,
      instructorClassURL: classItem.instructor!.classURL,
      instructorMeetingId: classItem.instructor!.meetingId,
      instructorPasscode: classItem.instructor!.passcode,
      classStatus: classItem.status,
      rebookableUntil: classItem.rebookableUntil,
      classCode: classItem.classCode,
      updatedAt: classItem.updatedAt,
      isFreeTrial: classItem.isFreeTrial,
    };
  });
  return customerClasses;
};

export const getCalendarClasses = async (instructorId: number) => {
  const classes = await prisma.class.findMany({
    where: {
      instructorId: instructorId,
      status: {
        in: [
          "booked",
          "rebooked",
          "completed",
          "canceledByInstructor",
          "canceledByAdmin",
        ],
      },
    },
    orderBy: {
      dateTime: "desc",
    },
    include: {
      classAttendance: {
        include: {
          children: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  const instructorCalendarClasses = classes.map((classItem) => {
    const start = classItem.dateTime!; // Guaranteed to exist for non-pending classes
    const end = new Date(new Date(start).getTime() + 25 * 60000).toISOString();

    const statusColorMap: Partial<Record<Status, string>> = {
      booked: UPCOMING_CLASS_COLOR,
      rebooked: UPCOMING_CLASS_COLOR,
      canceledByInstructor: CANCELED_CLASS_COLOR,
      canceledByAdmin: CANCELED_CLASS_COLOR,
      completed: COMPLETED_CLASS_COLOR,
    };

    const color = statusColorMap[classItem.status];

    const childrenNames = classItem.classAttendance
      .map((attendance) => attendance.children.name)
      .join(", ");

    return {
      classId: classItem.id,
      start,
      end,
      title: childrenNames,
      color,
      classStatus: classItem.status,
    };
  });
  return instructorCalendarClasses;
};

export const getClassToRebook = async (classId: number) => {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
  });

  return {
    status: classData?.status,
    recurringClassId: classData?.recurringClassId,
    rebookableUntil: classData?.rebookableUntil,
    classCode: classData?.classCode,
    isFreeTrial: classData?.isFreeTrial,
    dateTime: classData?.dateTime,
  };
};

export const rebookClass = async (
  oldClass: { id: number; status: Status },
  newClass: NewClassToRebookType,
  childrenToAttend: number[],
) => {
  return await prisma.$transaction(async (tx) => {
    await lockInstructorSlot(tx, newClass);
    await assertInstructorAvailable(tx, newClass);

    // Step 1: Update or delete the old class to be rebooked.
    // If the old class status is "canceled", update the rebookableUntil field to null to prevent further rebooking.
    if (
      oldClass.status === "canceledByCustomer" ||
      oldClass.status === "canceledByInstructor" ||
      oldClass.status === "canceledByAdmin"
    ) {
      await tx.class.update({
        where: { id: oldClass.id },
        data: { rebookableUntil: null },
      });
      // If the old class status is "pending", the cancelation history is not necessary, so delete the class.
    } else if (oldClass.status === "pending") {
      await tx.class.delete({ where: { id: oldClass.id } });
    }

    // Step 2: Create a new "rebooked" class and classAttendance records.
    const newRebookedClass = await tx.class.create({
      data: newClass,
    });
    await tx.classAttendance.createMany({
      data: childrenToAttend.map((childrenId) => ({
        classId: newRebookedClass.id,
        childrenId,
      })),
    });

    return newRebookedClass;
  });
};

const lockInstructorSlot = async (
  tx: Prisma.TransactionClient,
  newClass: NewClassToRebookType,
) => {
  if (!newClass.instructorId || !newClass.dateTime) return;
  const lockKey = `instructor:${newClass.instructorId}:${new Date(
    newClass.dateTime,
  ).toISOString()}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
};

const assertInstructorAvailable = async (
  tx: Prisma.TransactionClient,
  newClass: NewClassToRebookType,
) => {
  if (!newClass.instructorId || !newClass.dateTime) return;

  const targetDateTime = new Date(newClass.dateTime);
  const absence = await tx.instructorAbsence.findFirst({
    where: {
      instructorId: newClass.instructorId,
      absentAt: targetDateTime,
    },
  });
  if (absence) {
    throw new InstructorUnavailableError();
  }

  const targetDate = targetDateTime.toISOString().slice(0, 10);
  const nextDate = nDaysLater(1, new Date(`${targetDate}T00:00:00.000Z`))
    .toISOString()
    .slice(0, 10);

  const availableSlots = await getInstructorAvailableSlots(
    newClass.instructorId,
    targetDate,
    nextDate,
    "Asia/Tokyo",
    false,
  );
  const hasSlot = availableSlots.some(
    (slot) => slot.dateTime === targetDateTime.toISOString(),
  );

  if (!hasSlot) {
    throw new InstructorUnavailableError();
  }
};

export const createFreeTrialClass = async ({
  tx,
  customerId,
}: {
  tx: Prisma.TransactionClient;
  customerId: number;
}) => {
  const createdClass = await tx.class.create({
    data: {
      customerId,
      status: "pending",
      rebookableUntil: nHoursLater(180 * 24, new Date()), // 180 days (* 24 hours) after now
      updatedAt: new Date(),
      classCode: `ft-${customerId}`, // "ft" = free trial
      isFreeTrial: true,
    },
  });

  return createdClass;
};

export const declineFreeTrialClass = async (
  customerId: number,
  classCode?: string,
) => {
  const baseConditions = {
    customerId,
    isFreeTrial: true,
    status: {
      in: [
        Status.pending,
        Status.canceledByCustomer,
        Status.canceledByInstructor,
      ],
    },
  };

  const whereClause = classCode
    ? { ...baseConditions, classCode }
    : baseConditions;

  const updatedClass = await prisma.class.updateMany({
    where: whereClause,
    data: {
      status: Status.declined,
      updatedAt: new Date(),
      rebookableUntil: null,
    },
  });

  return updatedClass;
};

export const getSameDateClasses = async (
  instructorId: number,
  classId: number,
) => {
  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      dateTime: true,
      status: true,
      isFreeTrial: true,
      classCode: true,
      updatedAt: true,
      instructor: {
        select: {
          nickname: true,
          classURL: true,
          meetingId: true,
          passcode: true,
        },
      },
      customer: {
        select: {
          name: true,
          terminationAt: true,
          children: {
            select: {
              id: true,
              name: true,
              birthdate: true,
              personalInfo: true,
              customerId: true,
            },
          },
        },
      },
      classAttendance: {
        select: {
          children: {
            select: {
              id: true,
              name: true,
              birthdate: true,
              personalInfo: true,
              customerId: true,
            },
          },
        },
      },
    },
  });

  if (!targetClass?.dateTime) return [];

  const { startOfDay, endOfDay } = getJstDayRange(targetClass.dateTime);

  const classes = await prisma.class.findMany({
    where: {
      instructorId,
      status: {
        in: [
          "booked",
          "rebooked",
          "canceledByInstructor",
          "canceledByAdmin",
          "completed",
        ],
      },
      dateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      id: true,
      dateTime: true,
      status: true,
      isFreeTrial: true,
      customer: {
        select: {
          terminationAt: true,
          children: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      classAttendance: {
        select: {
          children: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { dateTime: "asc" },
  });

  const formattedTargetClass = {
    id: targetClass.id,
    dateTime: targetClass.dateTime!.toISOString(),
    customerName: targetClass.customer.name,
    instructorName: targetClass.instructor?.nickname || "",
    classURL: targetClass.instructor?.classURL || "",
    meetingId: targetClass.instructor?.meetingId || "",
    passcode: targetClass.instructor?.passcode || "",
    attendingChildren: targetClass.classAttendance.map((ca) => ca.children),
    customerChildren: targetClass.customer.children,
    status: targetClass.status,
    isFreeTrial: targetClass.isFreeTrial,
    classCode: targetClass.classCode,
    updatedAt: targetClass.updatedAt,
  };

  const formattedSameDayClasses = classes.map((cls) => ({
    id: cls.id,
    dateTime: cls.dateTime!.toISOString(),
    attendingChildren: cls.classAttendance.map((ca) => ca.children),
    customerChildren: cls.customer.children,
    status: cls.status,
    isFreeTrial: cls.isFreeTrial,
  }));

  return {
    selectedClassDetails: formattedTargetClass,
    sameDateClasses: formattedSameDayClasses,
  };
};

// Delete classes older than 1 year (13 months)
export const deleteOldClasses = async () => {
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - MONTHS_TO_DELETE_CLASSES);

  return await prisma.class.deleteMany({
    where: {
      dateTime: {
        lt: thresholdDate,
      },
    },
  });
};
