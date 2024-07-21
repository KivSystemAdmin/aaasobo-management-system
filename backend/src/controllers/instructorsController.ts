import { Request, Response } from "express";
import { prisma } from "../../prisma/prismaClient";
import { pickProperties } from "../helper/commonUtils";
import {
  getAllInstructorsAvailabilities,
  getInstructorById,
  addInstructorAvailabilities,
  addInstructorRecurringAvailability,
  getInstructorRecurringAvailabilities,
  deleteInstructorAvailability,
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

export const addRecurringAvailability = async (
  req: RequestWithId,
  res: Response,
) => {
  const { day, time, startDate } = req.body;
  if (!day || !time || !startDate) {
    return res.status(400).json({ message: "Invalid parameters provided." });
  }

  const TIME_ZONE_DIFF = 9; // Assume request data is Japanese time.
  const date = new Date(startDate);

  // The following calculation for setDate works only for after 09:00 in Japanese time.
  // Japanese time is UTC+9. Thus, after 09:00, date.getUTCDay() returns the same day as in Japan.
  date.setDate(date.getDate() + ((day - date.getUTCDay() + 7) % 7));

  const [hour, minute] = time.split(":");
  date.setUTCHours(hour - TIME_ZONE_DIFF);
  date.setUTCMinutes(minute);

  try {
    const recurringInstructorAvailability =
      await addInstructorRecurringAvailability(req.id, date);
    return res.status(200).json({ recurringInstructorAvailability });
  } catch (error) {
    return res.status(500).json({ message: `${error}` });
  }
};

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
