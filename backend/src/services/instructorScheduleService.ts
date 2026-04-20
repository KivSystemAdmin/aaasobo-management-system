import { prisma } from "../../prisma/prismaClient";
import { Prisma } from "../../generated/prisma";
import { JAPAN_TIME_DIFF, nDaysLater, nHoursLater } from "../utils/dateUtils";
import { EnglishBackground } from "../types";

function findFirstSlotOccurrenceOnOrAfter(
  effectiveFrom: Date,
  weekday: number,
  startTime: Date,
): Date {
  const slotHours = startTime.getUTCHours();
  const slotMinutes = startTime.getUTCMinutes();
  const currentWeekday = effectiveFrom.getUTCDay();
  const daysUntilSlot = (weekday - currentWeekday + 7) % 7;

  const occurrence = new Date(effectiveFrom);
  occurrence.setUTCDate(occurrence.getUTCDate() + daysUntilSlot);
  occurrence.setUTCHours(slotHours - JAPAN_TIME_DIFF, slotMinutes, 0, 0);

  return occurrence;
}

function matchesRecurringSlotInJst(
  startAt: Date | null,
  weekday: number,
  startTime: Date,
): boolean {
  if (!startAt) {
    return false;
  }

  const jstStartAt = new Date(
    startAt.getTime() + JAPAN_TIME_DIFF * 60 * 60 * 1000,
  );

  return (
    jstStartAt.getUTCDay() === weekday &&
    jstStartAt.getUTCHours() === startTime.getUTCHours() &&
    jstStartAt.getUTCMinutes() === startTime.getUTCMinutes()
  );
}

export const getInstructorSchedules = async (instructorId: number) => {
  try {
    return await prisma.instructorSchedule.findMany({
      where: { instructorId },
      orderBy: { effectiveFrom: "desc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor schedule versions.");
  }
};

export const getScheduleWithSlots = async (scheduleId: number) => {
  try {
    const schedule = await prisma.instructorSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        slots: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      },
    });

    if (!schedule) {
      return null;
    }

    return {
      ...schedule,
      slots: schedule.slots.map((slot) => ({
        ...slot,
        startTime: extractTime(slot.startTime),
      })),
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch schedule with slots.");
  }
};

export const getActiveInstructorSchedule = async (
  instructorId: number,
  effectiveDate: string,
) => {
  try {
    const activeSchedule = await prisma.instructorSchedule.findFirst({
      where: {
        instructorId,
        effectiveFrom: { lte: new Date(effectiveDate) },
        effectiveTo: null,
      },
      include: {
        slots: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      },
    });

    if (!activeSchedule) {
      return null;
    }

    return {
      ...activeSchedule,
      slots: activeSchedule.slots.map((slot) => ({
        ...slot,
        startTime: extractTime(slot.startTime),
      })),
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch active instructor schedule.");
  }
};

export const createInstructorSchedule = async (data: {
  instructorId: number;
  effectiveFrom: Date;
  timezone: string;
  slots: Array<{
    weekday: number;
    startTime: string; // HH:MM format
  }>;
}) => {
  try {
    const { instructorId, effectiveFrom, timezone, slots } = data;

    return await prisma.$transaction(async (tx) => {
      let canceledClassCount = 0;
      const terminatedRecurringClassIds = new Set<number>();
      const existingSchedules = await tx.instructorSchedule.findMany({
        where: { instructorId: instructorId },
        select: {
          id: true,
          effectiveFrom: true,
          effectiveTo: true,
          timezone: true,
        },
        orderBy: { effectiveFrom: "asc" },
      });

      const insertIndex = existingSchedules.findIndex(
        (s) => s.effectiveFrom > effectiveFrom,
      );

      interface InstructorSchedule {
        id: number;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        timezone: string;
      }
      let newSchedule: InstructorSchedule;
      let lastSchedule: InstructorSchedule;
      let nextSchedule: InstructorSchedule;

      lastSchedule = existingSchedules[insertIndex - 1];
      if (!lastSchedule) {
        lastSchedule = existingSchedules[existingSchedules.length - 1];
      }
      nextSchedule = existingSchedules[insertIndex];
      if (!nextSchedule) {
        nextSchedule = existingSchedules[insertIndex - 1];
      }

      if (lastSchedule) {
        const previousSlots = await tx.instructorSlot.findMany({
          where: { scheduleId: lastSchedule.id },
        });

        const removedSlots = previousSlots.filter(
          (previousSlot) =>
            !slots.some(
              (nextSlot) =>
                nextSlot.weekday === previousSlot.weekday &&
                nextSlot.startTime ===
                  previousSlot.startTime.toISOString().slice(11, 16),
            ),
        );

        const lockedSlotDateTimes = Array.from(
          new Set(
            removedSlots.map((removedSlot) =>
              findFirstSlotOccurrenceOnOrAfter(
                effectiveFrom,
                removedSlot.weekday,
                removedSlot.startTime,
              ).toISOString(),
            ),
          ),
        );

        for (const lockedSlotDateTimeIso of lockedSlotDateTimes) {
          const lockedSlotDateTime = new Date(lockedSlotDateTimeIso);
          const now = new Date();
          const lockKey = `instructor:${instructorId}:${lockedSlotDateTime.toISOString()}`;
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

          const canceledClasses = await tx.class.updateMany({
            where: {
              instructorId,
              dateTime: lockedSlotDateTime,
              status: {
                in: ["booked", "rebooked"],
              },
            },
            data: {
              status: "canceledByInstructor",
              canceledAt: now,
              rebookableUntil: nHoursLater(180 * 24, lockedSlotDateTime),
              updatedAt: now,
            },
          });
          canceledClassCount += canceledClasses.count;
        }

        if (removedSlots.length > 0) {
          const recurringClasses = await tx.recurringClass.findMany({
            where: {
              instructorId,
              OR: [{ endAt: null }, { endAt: { gte: effectiveFrom } }],
            },
            select: {
              id: true,
              startAt: true,
              endAt: true,
            },
          });

          for (const removedSlot of removedSlots) {
            const removedSlotDateTime = findFirstSlotOccurrenceOnOrAfter(
              effectiveFrom,
              removedSlot.weekday,
              removedSlot.startTime,
            );

            const matchingRecurringClasses = recurringClasses.filter(
              (recurringClass) =>
                matchesRecurringSlotInJst(
                  recurringClass.startAt,
                  removedSlot.weekday,
                  removedSlot.startTime,
                ) &&
                (!recurringClass.endAt ||
                  recurringClass.endAt >= removedSlotDateTime),
            );

            for (const recurringClass of matchingRecurringClasses) {
              await tx.recurringClass.update({
                where: { id: recurringClass.id },
                data: { endAt: removedSlotDateTime },
              });
              terminatedRecurringClassIds.add(recurringClass.id);

              await tx.class.deleteMany({
                where: {
                  recurringClassId: recurringClass.id,
                  dateTime: { gt: removedSlotDateTime },
                },
              });
            }
          }
        }
      }

      if (lastSchedule || nextSchedule) {
        if (
          lastSchedule?.effectiveFrom.getTime() === effectiveFrom.getTime() ||
          nextSchedule?.effectiveFrom.getTime() === effectiveFrom.getTime()
        ) {
          await tx.instructorSlot.deleteMany({
            where: {
              scheduleId: lastSchedule ? lastSchedule.id : nextSchedule.id,
            },
          });
          await tx.instructorSchedule.delete({
            where: { id: lastSchedule ? lastSchedule.id : nextSchedule.id },
          });
        } else {
          await tx.instructorSchedule.update({
            where: { id: lastSchedule.id },
            data: {
              effectiveTo: insertIndex === 0 ? null : effectiveFrom,
            },
          });
        }
      }

      newSchedule = await tx.instructorSchedule.create({
        data: {
          instructorId: instructorId,
          effectiveFrom: effectiveFrom,
          effectiveTo: nextSchedule ? nextSchedule.effectiveFrom : null,
          timezone: timezone,
        },
      });

      await tx.instructorSlot.createMany({
        data: slots.map((slot) => ({
          scheduleId: newSchedule.id,
          weekday: slot.weekday,
          startTime: new Date(`1970-01-01T${slot.startTime}:00.000Z`),
        })),
      });

      const createdSchedule = await tx.instructorSchedule.findUnique({
        where: { id: newSchedule.id },
        include: { slots: true },
      });

      if (!createdSchedule) {
        throw new Error("Failed to retrieve created schedule");
      }

      return {
        schedule: {
          ...createdSchedule,
          slots: createdSchedule.slots.map((slot) => ({
            ...slot,
            startTime: extractTime(slot.startTime),
          })),
        },
        impactSummary: {
          canceledClassCount,
          terminatedRecurringClassCount: terminatedRecurringClassIds.size,
        },
      };
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create schedule version.");
  }
};

export const getInstructorAvailableSlots = async (
  instructorId: number,
  startDate: string, // YYYY-MM-DD format
  endDate: string, // YYYY-MM-DD format
  timezone: string,
  excludeBookedSlots: boolean,
) => {
  try {
    if (timezone !== "Asia/Tokyo") {
      throw new Error("Only Asia/Tokyo timezone is supported");
    }

    const { schedules, excludeSlots } = await getSlotConstraints(
      instructorId,
      startDate,
      endDate,
      excludeBookedSlots,
    );

    const availableSlots = generateInstructorSlots(
      instructorId,
      schedules,
      new Date(startDate),
      new Date(endDate),
      excludeSlots,
    );

    return availableSlots;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor available slots.");
  }
};

interface AvailableSlotWithInstructors {
  dateTime: string;
  availableInstructors: number[];
}

export const getAllAvailableSlots = async (
  startDate: string, // YYYY-MM-DD format
  endDate: string, // YYYY-MM-DD format
  timezone: string,
): Promise<AvailableSlotWithInstructors[]> => {
  try {
    if (timezone !== "Asia/Tokyo") {
      throw new Error("Only Asia/Tokyo timezone is supported");
    }

    const { schedulesByInstructor, excludeSlots } =
      await getAllInstructorsConstraints(startDate, endDate);

    const slotToInstructorIds = new Map<string, Set<number>>();
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const [instructorId, instructorSchedules] of schedulesByInstructor) {
      const instructorSlots = generateInstructorSlots(
        instructorId,
        instructorSchedules,
        start,
        end,
        excludeSlots,
      );

      for (const slot of instructorSlots) {
        if (!slotToInstructorIds.has(slot.dateTime)) {
          slotToInstructorIds.set(slot.dateTime, new Set());
        }
        slotToInstructorIds.get(slot.dateTime)!.add(instructorId);
      }
    }

    const result: AvailableSlotWithInstructors[] = Array.from(
      slotToInstructorIds.entries(),
    )
      .map(([dateTime, instructorSet]) => ({
        dateTime,
        availableInstructors: Array.from(instructorSet).sort((a, b) => a - b),
      }))
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime));

    return result;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch all available slots.");
  }
};

export const getAvailableSlotsByType = async (
  startDate: string, // YYYY-MM-DD format
  endDate: string, // YYYY-MM-DD format
  timezone: string,
  englishBackground: EnglishBackground[],
): Promise<AvailableSlotWithInstructors[]> => {
  try {
    if (timezone !== "Asia/Tokyo") {
      throw new Error("Only Asia/Tokyo timezone is supported");
    }

    const { schedulesByInstructor, excludeSlots } =
      await getInstructorsConstraintsByType(
        startDate,
        endDate,
        englishBackground,
      );

    const slotToInstructorIds = new Map<string, Set<number>>();
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const [instructorId, instructorSchedules] of schedulesByInstructor) {
      const instructorSlots = generateInstructorSlots(
        instructorId,
        instructorSchedules,
        start,
        end,
        excludeSlots,
      );

      for (const slot of instructorSlots) {
        if (!slotToInstructorIds.has(slot.dateTime)) {
          slotToInstructorIds.set(slot.dateTime, new Set());
        }
        slotToInstructorIds.get(slot.dateTime)!.add(instructorId);
      }
    }

    const result: AvailableSlotWithInstructors[] = Array.from(
      slotToInstructorIds.entries(),
    )
      .map(([dateTime, instructorSet]) => ({
        dateTime,
        availableInstructors: Array.from(instructorSet).sort((a, b) => a - b),
      }))
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime));

    return result;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch native or non native available slots.");
  }
};

type InstructorSchedule = Prisma.InstructorScheduleGetPayload<{
  include: { slots: true };
}>;

interface AvailableSlot {
  dateTime: string;
}

// Extract time string (HH:MM) from DateTime
const extractTime = (dateTime: Date): string => {
  return dateTime.toISOString().substring(11, 16);
};

// Extract date string (YYYY-MM-DD) from DateTime
const extractDate = (dateTime: Date): string => {
  return dateTime.toISOString().split("T")[0];
};

// Create a Date object in JST (Japan Standard Time) from a date string
const jst = (dateStr: string): Date => {
  return new Date(dateStr + "T00:00:00+09:00");
};

interface SlotConstraints {
  schedules: InstructorSchedule[];
  excludeSlots: Set<string>;
}

const getSlotConstraints = async (
  instructorId: number,
  startDate: string,
  endDate: string,
  excludeBookedSlots: boolean,
): Promise<SlotConstraints> => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const [schedules, absences, completedClasses] = await Promise.all([
    prisma.instructorSchedule.findMany({
      where: {
        instructorId,
        timezone: "Asia/Tokyo",
        // Interval overlap: Two intervals [effectiveFrom, effectiveTo) and [start, end) overlap when:
        // max(effectiveFrom, start) < min(effectiveTo, end)
        // This simplifies to: effectiveFrom < end AND effectiveTo > start
        // Since effectiveTo can be NULL (infinite), we use OR condition:
        effectiveFrom: { lt: end },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: start } }],
      },
      include: {
        slots: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      },
      orderBy: { effectiveFrom: "asc" },
    }),
    prisma.instructorAbsence.findMany({
      where: {
        instructorId,
        absentAt: { gte: jst(startDate), lt: jst(endDate) },
      },
    }),
    prisma.class.findMany({
      where: {
        instructorId,
        dateTime: {
          gte: jst(startDate),
          lt: jst(endDate),
        },
        status: "completed",
      },
      select: { instructorId: true, dateTime: true },
    }),
  ]);

  const bookings = excludeBookedSlots
    ? await prisma.class.findMany({
        where: {
          instructorId,
          dateTime: {
            gte: jst(startDate),
            lt: jst(endDate),
          },
          status: { in: ["booked", "rebooked"] },
        },
        select: { instructorId: true, dateTime: true },
      })
    : [];

  const absenceSet = new Set(
    absences.map(
      (absence) => `${instructorId}-${absence.absentAt.toISOString()}`,
    ),
  );

  const completedClassSet = new Set(
    completedClasses
      .filter((classItem) => classItem.dateTime !== null)
      .map(
        (classItem) => `${instructorId}-${classItem.dateTime!.toISOString()}`,
      ),
  );

  const bookingSet = new Set(
    bookings
      .filter((booking) => booking.dateTime !== null)
      .map((booking) => `${instructorId}-${booking.dateTime!.toISOString()}`),
  );

  const excludeSlots = new Set([
    ...absenceSet,
    ...completedClassSet,
    ...bookingSet,
  ]);
  return { schedules, excludeSlots };
};

interface AllInstructorsConstraints {
  schedulesByInstructor: Map<number, InstructorSchedule[]>;
  excludeSlots: Set<string>;
}

const getAllInstructorsConstraints = async (
  startDate: string,
  endDate: string,
): Promise<AllInstructorsConstraints> => {
  const [schedules, absences, bookings] = await Promise.all([
    prisma.instructorSchedule.findMany({
      where: {
        timezone: "Asia/Tokyo",
        // Interval overlap: schedule overlaps with [start, end)
        effectiveFrom: { lt: new Date(endDate) },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gt: new Date(startDate) } },
        ],
      },
      include: {
        slots: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      },
      orderBy: { effectiveFrom: "asc" },
    }),
    prisma.instructorAbsence.findMany({
      where: {
        absentAt: {
          gte: jst(startDate),
          lt: jst(endDate),
        },
      },
    }),
    prisma.class.findMany({
      where: {
        dateTime: {
          gte: jst(startDate),
          lt: jst(endDate),
        },
        status: { in: ["booked", "rebooked"] },
      },
      select: {
        instructorId: true,
        dateTime: true,
      },
    }),
  ]);

  const absentDateTimes = new Set(
    absences.map(
      (absence) => `${absence.instructorId}-${absence.absentAt.toISOString()}`,
    ),
  );
  const bookedDateTimes = new Set(
    bookings.map(
      (booking) => `${booking.instructorId}-${booking.dateTime?.toISOString()}`,
    ),
  );

  const excludeSlots = new Set([...absentDateTimes, ...bookedDateTimes]);

  // Group schedules by instructor ID
  const schedulesByInstructor = new Map<number, InstructorSchedule[]>();
  for (const schedule of schedules) {
    if (!schedulesByInstructor.has(schedule.instructorId)) {
      schedulesByInstructor.set(schedule.instructorId, []);
    }
    schedulesByInstructor.get(schedule.instructorId)!.push(schedule);
  }

  return { schedulesByInstructor, excludeSlots };
};

const getInstructorsConstraintsByType = async (
  startDate: string,
  endDate: string,
  englishBackground: EnglishBackground[],
): Promise<AllInstructorsConstraints> => {
  const [schedules, absences, bookings] = await Promise.all([
    prisma.instructorSchedule.findMany({
      where: {
        timezone: "Asia/Tokyo",
        // Interval overlap: schedule overlaps with [start, end)
        effectiveFrom: { lt: new Date(endDate) },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gt: new Date(startDate) } },
        ],
        instructor: { englishBackground: { in: englishBackground } },
      },
      include: {
        slots: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      },
      orderBy: { effectiveFrom: "asc" },
    }),
    prisma.instructorAbsence.findMany({
      where: {
        absentAt: {
          gte: jst(startDate),
          lt: jst(endDate),
        },
      },
    }),
    prisma.class.findMany({
      where: {
        dateTime: {
          gte: jst(startDate),
          lt: jst(endDate),
        },
        status: { in: ["booked", "rebooked"] },
      },
      select: {
        instructorId: true,
        dateTime: true,
      },
    }),
  ]);

  const absentDateTimes = new Set(
    absences.map(
      (absence) => `${absence.instructorId}-${absence.absentAt.toISOString()}`,
    ),
  );
  const bookedDateTimes = new Set(
    bookings.map(
      (booking) => `${booking.instructorId}-${booking.dateTime?.toISOString()}`,
    ),
  );

  const excludeSlots = new Set([...absentDateTimes, ...bookedDateTimes]);

  // Group schedules by instructor ID
  const schedulesByInstructor = new Map<number, InstructorSchedule[]>();
  for (const schedule of schedules) {
    if (!schedulesByInstructor.has(schedule.instructorId)) {
      schedulesByInstructor.set(schedule.instructorId, []);
    }
    schedulesByInstructor.get(schedule.instructorId)!.push(schedule);
  }

  return { schedulesByInstructor, excludeSlots };
};

// Find the schedule that is effective for a given date
const findEffectiveSchedule = (
  schedules: InstructorSchedule[],
  dateStr: string, // YYYY-MM-DD
): InstructorSchedule | undefined => {
  return schedules.find((s) => {
    const scheduleStart = extractDate(s.effectiveFrom);
    const scheduleEnd = s.effectiveTo ? extractDate(s.effectiveTo) : null;

    return (
      scheduleStart <= dateStr &&
      (scheduleEnd === null || dateStr < scheduleEnd)
    );
  });
};

// Generate available slots for all schedules of an instructor
const generateInstructorSlots = (
  instructorId: number,
  schedules: InstructorSchedule[],
  start: Date,
  end: Date,
  excludeSlots: Set<string>,
): AvailableSlot[] => {
  const slots: AvailableSlot[] = [];

  for (let current = start; current < end; current = nDaysLater(1, current)) {
    const currentDateStr = extractDate(current);

    const effectiveSchedule = findEffectiveSchedule(schedules, currentDateStr);
    if (!effectiveSchedule) {
      continue;
    }

    const daySlots = effectiveSchedule.slots.filter(
      (slot) => slot.weekday === current.getUTCDay(),
    );

    for (const slot of daySlots) {
      const timeStr = extractTime(slot.startTime);
      const tokyoDateTime = new Date(`${currentDateStr}T${timeStr}:00+09:00`);
      const utcDateTime = tokyoDateTime.toISOString();

      if (excludeSlots.has(`${instructorId}-${utcDateTime}`)) {
        continue;
      }

      slots.push({ dateTime: utcDateTime });
    }
  }

  return slots;
};
