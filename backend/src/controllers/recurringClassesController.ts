import { Request, Response } from "express";
import {
  addRecurringClass,
  deleteRecurringClass,
  getRecurringClassByRecurringClassId,
  getRecurringClassesBySubscriptionId,
  getValidRecurringClassesByInstructorId,
  terminateRecurringClass,
} from "../services/recurringClassesService";
import { RequestWithId } from "../middlewares/parseId.middleware";
import {
  getFirstDateInMonths,
  createDatesBetween,
  calculateFirstDate,
  JAPAN_TIME_DIFF,
} from "../helper/dateUtils";
import { prisma } from "../../prisma/prismaClient";

// POST a recurring class
export const addRecurringClassController = async (
  req: Request,
  res: Response,
) => {
  const {
    instructorId,
    customerId,
    childrenIds,
    subscriptionId,
    startAt,
    endAt,
  } = req.body;
  if (
    !instructorId ||
    !customerId ||
    !childrenIds ||
    !subscriptionId ||
    !startAt ||
    !endAt
  ) {
    return res.status(400).json({ message: "Values are not found" });
  }

  // TODO: Implement when you add a new recurring class

  try {
    // const recurringClass = await addRecurringClass(
    //   instructorId,
    //   customerId,
    //   childrenIds,
    //   subscriptionId,
    //   startAt,
    //   dateTime,
    // );

    res.status(200).json({
      message: "Recurring class is created successfully",
      // recurringClass,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// GET recurring classes by subscription id.
export const getRecurringClassesBySubscriptionIdController = async (
  req: Request,
  res: Response,
) => {
  const subscriptionId = parseInt(req.query.subscriptionId as string);
  if (isNaN(subscriptionId)) {
    res.status(400).json({ error: "Invalid subscription ID" });
    return;
  }

  try {
    // Get the local date and the begging of its time.
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const today = date.toISOString().split("T")[0];

    const data = await getRecurringClassesBySubscriptionId(
      subscriptionId,
      new Date(today + "T00:00:00Z"),
    );

    const recurringClasses = data.map((recurringClass) => {
      const {
        id,
        startAt,
        instructorId,
        instructor,
        recurringClassAttendance,
        endAt,
      } = recurringClass;

      const childrenIds = recurringClassAttendance.map(
        (children) => children.childrenId,
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

    res.json({ recurringClasses });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// Update recurring classes
export const updateRecurringClassesController = async (
  req: RequestWithId,
  res: Response,
) => {
  const {
    subscriptionId,
    day,
    time,
    instructorId,
    customerId,
    childrenIds,
    classStartDate,
  } = req.body;
  if (
    !subscriptionId ||
    !day ||
    !time ||
    !instructorId ||
    !customerId ||
    !childrenIds ||
    !classStartDate
  ) {
    return res.status(400).json({ message: "Invalid parameters provided." });
  }

  // If classStartDate is shorter than today, it shouldn't be executed.
  // This validation is commented out as of now.
  const today = new Date();
  const jpnToday = new Date(today.getTime() + JAPAN_TIME_DIFF * 60 * 60 * 1000);
  // if (new Date(classStartDate) <= jpnToday) {
  //   return res.status(400).json({ message: "Invalid Start From Date" });
  // }

  try {
    const updatedRecurringClasses = await prisma.$transaction(async (tx) => {
      // GET the current recurring class by recurring class id
      const recurringClass = await getRecurringClassByRecurringClassId(
        tx,
        req.id,
      );
      if (!recurringClass) {
        throw new Error("Recurring class not found");
      }
      const { endAt, startAt } = recurringClass;

      const firstClassDate = calculateFirstDate(
        new Date(classStartDate),
        day,
        time,
      );
      let dateTimes: Date[] = [];
      const newStartAt = calculateFirstDate(
        new Date(classStartDate),
        day,
        time,
      );
      let newEndAt: Date | null = null;

      // Configure conditions for updating recurring classes.
      // [Condition1]
      // EndAt is not null and classStartDate is the same or later than endAt.
      // -> Classes shouldn't be created.
      // [Condition2]
      // EndAt is not null and classStartDate is earlier than endAt.
      // -> All upcoming classes are deleted and recreated new recurring ones until EndAt.
      // [Condition3]
      // EndAt is null
      // -> All upcoming classes are deleted and recreated new recurring ones until the end of the next two months.

      const condition1 =
        endAt !== null && new Date(endAt) <= new Date(classStartDate);
      const condition2 =
        endAt !== null && new Date(classStartDate) < new Date(endAt);
      const condition3 = endAt === null;

      // Condition1
      if (condition1) {
        throw new Error("Regular class cannot be edited");
      }

      // Terminate the current recurring class.
      await terminateRecurringClass(tx, req.id, new Date(classStartDate));

      // Delete unnecessary future recurring class.
      const date = new Date(classStartDate);
      const utcClassStartDate = new Date(
        date.getTime() - JAPAN_TIME_DIFF * 60 * 60 * 1000,
      );
      if (
        startAt === null ||
        (startAt !== null && new Date(utcClassStartDate) < new Date(startAt))
      ) {
        await deleteRecurringClass(tx, req.id);
      }

      // Condition2
      if (condition2) {
        // Store the endAt to newEndAt
        newEndAt = endAt;

        // Generate recurring dates until EndAt.
        const until = endAt;
        dateTimes = createDatesBetween(firstClassDate, until);
      }

      // Condition3
      if (condition3) {
        // Generate recurring dates until the end of the next two months.
        const until = getFirstDateInMonths(firstClassDate, 2);
        dateTimes = createDatesBetween(firstClassDate, until);
      }

      // Add a new recurring class
      return await addRecurringClass(
        tx,
        instructorId,
        customerId,
        childrenIds,
        subscriptionId,
        newStartAt,
        dateTimes,
        newEndAt ?? null,
      );
    });

    res.status(200).json({
      message: "Regular Class is updated successfully",
      updatedRecurringClasses,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// GET recurring classes by instructor id.
export const getRecurringClassesByInstructorIdController = async (
  req: Request,
  res: Response,
) => {
  const instructorId = parseInt(req.query.instructorId as string);
  if (isNaN(instructorId)) {
    res.status(400).json({ error: "Invalid instructor ID" });
    return;
  }

  try {
    // Get the local date and the begging of its time.
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const today = date.toISOString().split("T")[0];

    const recurringClasses = await getValidRecurringClassesByInstructorId(
      instructorId,
      new Date(today + "T00:00:00Z"),
    );

    res.json({ recurringClasses });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};
