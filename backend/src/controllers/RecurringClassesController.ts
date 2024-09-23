import { Request, Response } from "express";
import {
  addRecurringClass,
  getRecurringClassesBySubscriptionId,
  terminateRecurringClass,
} from "../services/recurringClassesService";
import { RequestWithId } from "../middlewares/parseId.middleware";
import {
  getFirstDateInMonths,
  createDatesBetween,
  calculateFirstDate,
  JAPAN_TIME_DIFF,
} from "../helper/dateUtils";

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
    dateTime,
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
    const recurringClasses =
      await getRecurringClassesBySubscriptionId(subscriptionId);

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
    startDate,
  } = req.body;
  if (
    !subscriptionId ||
    !day ||
    !time ||
    !instructorId ||
    !customerId ||
    !childrenIds ||
    !startDate
  ) {
    return res.status(400).json({ message: "Invalid parameters provided." });
  }

  try {
    const endAt = new Date(startDate);

    // Add endAt to the current recurring class
    await terminateRecurringClass(req.id, endAt);

    const date = calculateFirstDate(new Date(startDate), day, time);

    // Define the end date for the recurring classes.
    const until = getFirstDateInMonths(date, 2);

    const [hour, minute] = time.split(":");
    date.setUTCHours(hour - JAPAN_TIME_DIFF);
    date.setUTCMinutes(minute);

    // Generate recurring dates until the end date.
    const dateTimes = createDatesBetween(new Date(date), until);

    // Add a new recurring class
    const updatedRecurringClasses = await addRecurringClass(
      instructorId,
      customerId,
      childrenIds,
      subscriptionId,
      date,
      dateTimes,
    );
    res.json({ updatedRecurringClasses });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};
