import { Request, Response } from "express";
import { prisma } from "../../prisma/prismaClient";
import { pickProperties } from "../helper/commonUtils";
import {
  Day,
  days,
  JAPAN_TIME_DIFF,
  createDatesBetween,
  calculateFirstDate,
} from "../helper/dateUtils";
import {
  getAllInstructorsAvailabilities,
  getInstructorById,
  addInstructorAvailabilities,
  addInstructorRecurringAvailability,
  getInstructorRecurringAvailabilities,
  deleteInstructorAvailability,
  getInstructorWithRecurringAvailability,
  terminateRecurringAvailability,
  getInstructorWithRecurringAvailabilityDay,
  updateRecurringAvailabilityInterval,
} from "../services/instructorsService";
import { type RequestWithId } from "../middlewares/parseId.middleware";

// Fetch all the instructors and their availabilities
export const getAllInstructorsAvailabilitiesController = async (
  _: Request,
  res: Response,
) => {
  try {
    // Fetch the instructors and their availabilities data from the DB
    const instructors = await getAllInstructorsAvailabilities();

    // Define the properties to pick.
    const selectedProperties = ["id", "name", "instructorAvailability"];

    // Define the property name mapping.
    const propertyMapping = {
      instructorAvailability: "availabilities",
    };

    // Transform the data structure.
    const data = instructors.map((instructor) =>
      pickProperties(instructor, selectedProperties, propertyMapping),
    );

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

function setErrorResponse(res: Response, error: unknown) {
  return res
    .status(500)
    .json({ message: error instanceof Error ? error.message : `${error}` });
}

export const getInstructor = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID provided." });
  }
  try {
    const instructor = await getInstructorById(id);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found." });
    }
    return res.status(200).json({
      instructor: {
        id: instructor.id,
        name: instructor.name,
        availabilities: instructor.instructorAvailability,
        nickname: instructor.nickname,
        email: instructor.email,
        icon: instructor.icon,
        classLink: instructor.classLink,
      },
    });
  } catch (error) {
    return setErrorResponse(res, error);
  }
};

export module RecurringAvailability {
  // Returns the recurring availability that is valid on a specific date.
  export const get = async (req: RequestWithId, res: Response) => {
    if (!req.query.date) {
      return res.status(400).json({ message: "Invalid date provided." });
    }
    // Include recurring availability starting on `date`.
    // e.g., req.query.date = 2024-07-24 => date: 2024-07-24 23:59:59
    const date = new Date(req.query.date as string);
    date.setUTCDate(date.getUTCDate() + 1);
    date.setSeconds(-1);

    const instructor = await callServiceWithoutException(() =>
      getInstructorWithRecurringAvailability(req.id),
    );
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found." });
    }
    if ("message" in instructor) {
      return res.status(500).json({ message: instructor.message });
    }

    const availabilitiesOfDay = instructor.instructorRecurringAvailability
      .filter(({ startAt, endAt }) => {
        const notStarted = date < startAt;
        const alreadyEnded = endAt && endAt <= date;
        return !notStarted && !alreadyEnded;
      })
      .map(({ startAt }) => {
        const [hour, minute] = [
          startAt.getUTCHours() + JAPAN_TIME_DIFF,
          startAt.getUTCMinutes(),
        ];
        return { day: getDayName(startAt), time: formatTime(hour, minute) };
      });

    return res.status(200).json({
      id: instructor.id,
      name: instructor.name,
      recurringAvailabilities: groupByDay(availabilitiesOfDay),
    });
  };

  type RecurringAvailabilityWithDay = {
    id: number;
    instructorId: number;
    startAt: Date;
    endAt?: Date;
    day: Day;
    time: string;
  };

  export const put = async (req: RequestWithId, res: Response) => {
    const {
      slotsOfDays,
      startDate: startDateStr,
    }: { slotsOfDays: SlotsOfDays; startDate: string } = req.body;

    const startDate = new Date(startDateStr);
    const newEndAt = startDate;

    // Use Promise.all to avoid the error "Transaction already closed: Could not perform operation.".
    const tasks: Promise<any>[] = [];
    await prisma.$transaction(async (tx) => {
      const recurrings = (await getInstructorWithRecurringAvailabilityDay(
        req.id,
        tx,
      )) as RecurringAvailabilityWithDay[];

      for (const { id, startAt, endAt, day, time } of recurrings) {
        const isIncludedInNewSchedule = slotsOfDays[day].some(
          (slot) => slot === time,
        );
        if (!isIncludedInNewSchedule) {
          const end = maxDate(startAt, newEndAt);
          tasks.push(terminateRecurringAvailability(req.id, id, end, tx));
          continue;
        }

        const newStartAt = calculateFirstDate(startDate, day, time);
        if (endAt && endAt < newStartAt) {
          // startAt  endAt  newStartAt
          // |---------|      |----------
          tasks.push(
            addInstructorRecurringAvailability(req.id, newStartAt, tx),
          );
        }

        // newStartAt  startAt  (endAt)
        //   |---------------------
        // startAt  newStartAt  (endAt)
        //   |---------------------
        const start = minDate(startAt, newStartAt);
        tasks.push(updateRecurringAvailabilityInterval(id, start, null, tx));
      }

      // Create new recurring availabilities.
      days.forEach((day) => {
        slotsOfDays[day]
          .filter((time) => {
            // Exclude data already processed above.
            const existsInDb = recurrings.some(
              (a) => a.day === day && a.time === time,
            );
            return !existsInDb;
          })
          .forEach(async (time) => {
            const startAt = calculateFirstDate(startDate, day, time);
            tasks.push(addInstructorRecurringAvailability(req.id, startAt, tx));
          });
      });

      await Promise.all(tasks);
    });

    res.status(200);
  };

  type SlotsOfDays = {
    // time must be in 24 format: "HH:MM"
    [day in Day]: string[];
  };

  const getDayName = (date: Date): Day => {
    return days[date.getUTCDay()];
  };

  const minDate = (a: Date, b: Date) => {
    return a < b ? a : b;
  };

  const maxDate = (a: Date, b: Date) => {
    return a > b ? a : b;
  };

  // Format the time to "HH:MM".
  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, "0");
    const m = minute.toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  function groupByDay(dayTimes: { day: Day; time: string }[]) {
    const res: { [day in Day]: string[] } = {
      Sun: [],
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
    };
    for (const { day, time } of dayTimes) {
      res[day].push(time);
    }
    return res;
  }

  async function callServiceWithoutException<T>(
    func: () => Promise<T>,
  ): Promise<T | { message: string }> {
    try {
      return await func();
    } catch (error) {
      return { message: error instanceof Error ? error.message : `${error}` };
    }
  }
}

export const addAvailability = async (req: RequestWithId, res: Response) => {
  const { from: fromStr, until: untilStr } = req.body;
  if (!fromStr || !untilStr) {
    return res.status(400).json({ message: "Invalid parameters provided." });
  }
  const until = new Date(untilStr);
  until.setUTCDate(until.getUTCDate() + 1); // include until date
  const from = new Date(fromStr);
  if (until < from) {
    return res.status(400).json({ message: "Invalid range provided." });
  }
  await prisma.$transaction(async (tx) => {
    const recurringAvailabilities = await getInstructorRecurringAvailabilities(
      tx,
      req.id,
    );
    // Get overlapping dates of [startAt, endAt) and [from, until).
    const dateTimes = recurringAvailabilities.map(
      ({ id, startAt: startAtStr, endAt: endAtStr }) => {
        const startAt = new Date(startAtStr);
        const endAt = endAtStr ? new Date(endAtStr) : null;
        // from  until  startAt  endAt
        // || (empty)
        if (until <= startAt) {
          return { instructorRecurringAvailabilityId: id, dateTimes: [] };
        }
        // startAt  endAt  from  until
        // || (empty)
        if (endAt && endAt <= from) {
          return { instructorRecurringAvailabilityId: id, dateTimes: [] };
        }
        const start = startAt;
        while (startAt < from) {
          startAt.setUTCDate(startAt.getUTCDate() + 7);
        }
        if (!endAt) {
          // start  until
          //   |------|
          return {
            instructorRecurringAvailabilityId: id,
            dateTimes: createDatesBetween(start, until),
          };
        }
        const end = until < endAt ? until : endAt;
        // start  end
        //   |-----|
        return {
          instructorRecurringAvailabilityId: id,
          dateTimes: createDatesBetween(start, end),
        };
      },
    );
    await addInstructorAvailabilities(tx, req.id, dateTimes);
  });
  return res.status(200);
};

export const deleteAvailability = async (req: RequestWithId, res: Response) => {
  const { dateTime } = req.body;
  if (!dateTime) {
    return res.status(400).json({ message: "Invalid dateTime provided." });
  }
  const availability = await deleteInstructorAvailability(req.id, dateTime);
  return res.status(200).json({ availability });
};
