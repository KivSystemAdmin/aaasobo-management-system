import { Request, Response } from "express";
import { prisma } from "../../prisma/prismaClient";
import { pickProperties } from "../helper/commonUtils";
import { Day, calculateFirstDate } from "../helper/dateUtils";
import {
  getAllInstructorsAvailabilities,
  getInstructorById,
  addInstructorAvailabilities,
  addInstructorRecurringAvailability,
  getInstructorRecurringAvailabilities,
  deleteInstructorAvailability,
  getInstructorWithRecurringAvailability,
  fetchInstructorAvailabilities,
  getAllInstructors,
  getValidRecurringAvailabilities,
} from "../services/instructorsService";
import { type RequestWithId } from "../middlewares/parseId.middleware";

// Fetch all the instructors and their availabilities
export const getAllInstructorsAvailabilitiesController = async (
  req: Request,
  res: Response,
) => {
  const { day, time, from } = req.query;
  if (day && time && from) {
    const instructors = await searchInstructorsUsingRecurringAvailability(
      day as Day,
      time as string,
      from as string,
    );
    return res.status(200).json({ instructors });
  }

  try {
    // Fetch the instructors and their availabilities data from the DB
    const instructors = await getAllInstructorsAvailabilities();

    // Define the properties to pick.
    const selectedProperties = [
      "id",
      "name",
      "instructorAvailability",
      "instructorUnavailability",
    ];

    // Define the property name mapping.
    const propertyMapping = {
      instructorAvailability: "availabilities",
      instructorUnavailability: "unavailabilities",
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

// Return instructors who are available on the specific day and time after the `from` date.
// This function is expected to be used to find instructors for a regular class,
// so availability that is supposed to end is not included.
// Example:
// Elian has a recurring availability with `startAt` = 2024-07-02T08:00:00.000Z = Tue 17:00.
// With parameters day = "Tue", time = "17:00", and from = "2024-07-01", Elian should be included.
async function searchInstructorsUsingRecurringAvailability(
  day: Day,
  time: string,
  from: string,
) {
  const firstDate = calculateFirstDate(new Date(from), day, time);
  const nextDay = new Date(firstDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  nextDay.setUTCHours(0, 0, 0);

  const [hour, minute] = time.split(":").map(Number);

  // queryRaw is used to use EXTRACT function.
  const instructors = await prisma.$queryRaw`
      SELECT
        "Instructor".*
      FROM
        "InstructorRecurringAvailability"
        INNER JOIN "Instructor"
          ON "Instructor".id = "InstructorRecurringAvailability"."instructorId"
      WHERE
        to_char("startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'Dy') = ${day}
        AND EXTRACT(HOUR FROM "startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') = ${hour}
        AND EXTRACT(MINUTE FROM "startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') = ${minute}
        AND ("startAt" < ${nextDay} AND "endAt" IS NULL)
    `;
  return instructors;
}

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
        classURL: instructor.classURL,
        meetingId: instructor.meetingId,
        passcode: instructor.passcode,
        introductionURL: instructor.introductionURL,
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
        const alreadyEnded = endAt && endAt < date;
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

  export const put = async (req: RequestWithId, res: Response) => {
    const { day, time, startDate } = req.body;
    if (!day || !time || !startDate) {
      return res.status(400).json({ message: "Invalid parameters provided." });
    }

    const date = new Date(startDate);

    // The following calculation for setDate works only for after 09:00 in Japanese time.
    // Japanese time is UTC+9. Thus, after 09:00, date.getUTCDay() returns the same day as in Japan.
    date.setDate(date.getDate() + ((day - date.getUTCDay() + 7) % 7));

    const [hour, minute] = time.split(":");
    date.setUTCHours(hour - JAPAN_TIME_DIFF);
    date.setUTCMinutes(minute);

    try {
      const recurringInstructorAvailability =
        await addInstructorRecurringAvailability(req.id, date);
      return res.status(200).json({ recurringInstructorAvailability });
    } catch (error) {
      return res.status(500).json({ message: `${error}` });
    }
  };

  type Day = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

  // Request and response are in Japanese time.
  const JAPAN_TIME_DIFF = 9;

  const getDayName = (date: Date): Day => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    return days[date.getUTCDay()];
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
  const until = new Date(untilStr + "T23:59:59Z"); // include until date
  const from = new Date(fromStr);
  if (until < from) {
    return res.status(400).json({ message: "Invalid range provided." });
  }
  await prisma.$transaction(async (tx) => {
    const recurringAvailabilities = await getInstructorRecurringAvailabilities(
      tx,
      req.id,
    );
    // Get overlapping dates of [startAt, endAt] and [from, until].
    const dateTimes = recurringAvailabilities.map(
      ({ id, startAt: startAtStr, endAt: endAtStr }) => {
        const startAt = new Date(startAtStr);
        const endAt = endAtStr ? new Date(endAtStr) : null;
        // from  until  startAt  endAt
        // || (empty)
        if (until < startAt) {
          return { instructorRecurringAvailabilityId: id, dateTimes: [] };
        }
        // startAt  endAt  from  until
        // || (empty)
        if (endAt && endAt < from) {
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

// Generate the data between `from` and `until` dates including `until`.
function createDatesBetween(start: Date, end: Date): Date[] {
  const dates = [];
  while (start <= end) {
    dates.push(new Date(start));
    start.setUTCDate(start.getUTCDate() + 7);
  }
  return dates;
}

export const deleteAvailability = async (req: RequestWithId, res: Response) => {
  const { dateTime } = req.body;
  if (!dateTime) {
    return res.status(400).json({ message: "Invalid dateTime provided." });
  }
  const availability = await deleteInstructorAvailability(req.id, dateTime);
  return res.status(200).json({ availability });
};

export const getInstructorAvailabilities = async (
  req: RequestWithId,
  res: Response,
) => {
  try {
    const instructorAvailabilities = await fetchInstructorAvailabilities(
      req.id,
    );

    if (!instructorAvailabilities) {
      return res
        .status(404)
        .json({ message: "Instructor availabilities not found." });
    }
    return res.status(200).json({
      instructorAvailabilities,
    });
  } catch (error) {
    return setErrorResponse(res, error);
  }
};

export const getAllInstructorsController = async (
  _: Request,
  res: Response,
) => {
  try {
    const instructors = await getAllInstructors();
    if (!instructors) {
      return res.status(404).json({ message: "Instructors not found." });
    }
    return res.status(200).json({ instructors });
  } catch (error) {
    return setErrorResponse(res, error);
  }
};

// GET recurring availability by instructor id.
export const getRecurringAvailabilityById = async (
  req: RequestWithId,
  res: Response,
) => {
  // Get the local date and the end of its time.
  const today = new Date();
  today.setUTCHours(23, 59, 59, 0);
  today.setDate(today.getDate());
  try {
    const recurringAvailabilities = await getValidRecurringAvailabilities(
      req.id,
      today,
    );

    res.json({ recurringAvailabilities });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};
