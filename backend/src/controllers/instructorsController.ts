import { Request, Response } from "express";
import { RRule } from "rrule";
import { type InstructorRecurringAvailability } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { getEndOfNextMonth, pickProperties } from "../helper/commonUtils";
import {
  getAllInstructorsAvailabilities,
  getInstructorById,
  addInstructorAvailability,
  addInstructorRecurringAvailability,
  deleteInstructorRecurringAvailability,
  getActiveRecurringAvailabilities,
  insertInstructorAvailabilityIfNotExist,
} from "../services/instructorsService";

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

export const addAvailability = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID provided." });
  }
  const { type, dateTime } = req.body;
  if (!dateTime) {
    return res.status(400).json({ message: "Invalid dateTime provided." });
  }
  switch (type) {
    case "slot":
      return addSlotAvailability(res, id, dateTime);
    case "recurring":
      return addRecurringAvailability(res, id, dateTime);
    default:
      return res.status(400).json({ message: "Invalid type provided." });
  }
};

export const deleteAvailability = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID provided." });
  }
  const { type, dateTime } = req.body;
  if (!dateTime) {
    return res.status(400).json({ message: "Invalid dateTime provided." });
  }
  switch (type) {
    case "slot":
      return deleteSlotAvailability(res, id, dateTime);
    case "recurring":
      return deleteRecurringAvailability(res, id, dateTime);
    default:
      return res.status(400).json({ message: "Invalid type provided." });
  }
};

export const extendAvailability = async (req: Request, res: Response) => {
  const instructorId = parseInt(req.params.id);
  if (isNaN(instructorId)) {
    return res.status(400).json({ message: "Invalid ID provided." });
  }
  const { until } = req.body;
  if (!until) {
    return res.status(400).json({ message: "Invalid until provided." });
  }

  const extend = async (recurring: InstructorRecurringAvailability) => {
    const rrule = RRule.fromString(recurring.rrule);
    const dateTimes = rrule.between(
      rrule.options.dtstart,
      new Date(until),
      true,
    );
    return await Promise.all(
      dateTimes.map(async (dateTime) => {
        return await insertInstructorAvailabilityIfNotExist(
          instructorId,
          dateTime,
          recurring.id,
        );
      }),
    );
  };

  try {
    const recurrings = await getActiveRecurringAvailabilities(instructorId);
    await Promise.all(recurrings.map(extend));
    res.status(200).json({ recurringAvailabilities: recurrings });
  } catch (error) {
    return setErrorResponse(res, error);
  }
};

async function addSlotAvailability(
  res: Response,
  instructorId: number,
  dateTime: string,
) {
  try {
    const availability = await addInstructorAvailability(
      instructorId,
      null,
      dateTime,
    );
    if (!availability) {
      return res.status(404).json({ message: "Instructor not found." });
    }
    return res.status(200).json({ availability });
  } catch (error) {
    return setErrorResponse(res, error);
  }
}

async function addRecurringAvailability(
  res: Response,
  instructorId: number,
  dateTime: string,
) {
  const date = new Date(dateTime);
  const rrule = new RRule({
    freq: RRule.WEEKLY,
    dtstart: date,
  });

  // Generate the recurring availabilities until the next month based on the current business workflow.
  const dateTimes = rrule.between(date, getEndOfNextMonth(date), true);
  try {
    const availability = await addInstructorRecurringAvailability(
      instructorId,
      rrule.toString(),
      dateTimes,
    );
    return res.status(200).json({ availability });
  } catch (error) {
    return setErrorResponse(res, error);
  }
}

async function deleteSlotAvailability(
  res: Response,
  instructorId: number,
  dateTime: string,
) {
  try {
    const availability = await prisma.instructorAvailability.delete({
      where: { instructorId_dateTime: { instructorId, dateTime } },
    });
    return res.status(200).json({ availability });
  } catch (error) {
    return setErrorResponse(res, error);
  }
}

// Delete `dateTime` and following availabilities.
async function deleteRecurringAvailability(
  res: Response,
  instructorId: number,
  dateTime: string,
) {
  try {
    const recurring = await deleteInstructorRecurringAvailability(
      instructorId,
      dateTime,
      (rrule: string) => {
        // Set UNTIL property to indicate this recrring availability has ended.
        const prev = RRule.fromString(rrule);
        const r = new RRule({
          freq: prev.options.freq,
          dtstart: prev.options.dtstart,
          until: new Date(new Date(dateTime).getTime() - 1),
        });
        return r.toString();
      },
    );
    return res.status(200).json({ recurring });
  } catch (error) {
    return setErrorResponse(res, error);
  }
}
