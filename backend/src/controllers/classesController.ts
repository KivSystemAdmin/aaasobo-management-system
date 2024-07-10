import { Request, Response } from "express";
import {
  countClassesOfSubscription,
  createClass,
  deleteClass,
  getAllClasses,
  getClassesByCustomerId,
} from "../services/classesService";
import { getActiveSubscription } from "../services/subscriptionsService";
import { prisma } from "../../prisma/prismaClient";

// GET all classes along with related instructors and customers data
export const getAllClassesController = async (_: Request, res: Response) => {
  try {
    const classes = await getAllClasses();

    const classesData = classes.map((eachClass) => {
      const { id, dateTime, customer, instructor, status } = eachClass;

      return {
        id,
        dateTime,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        instructor: {
          id: instructor.id,
          name: instructor.name,
        },
        status,
      };
    });

    res.json({ classes: classesData });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch classes." });
  }
};

// GET classes by customer id along with related instructors and customers data
export const getClassesByCustomerIdController = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);

  try {
    const classes = await getClassesByCustomerId(id);

    const classesData = classes.map((eachClass) => {
      const { id, dateTime, customer, instructor, status, classAttendance } =
        eachClass;

      return {
        id,
        dateTime,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        instructor: {
          id: instructor.id,
          name: instructor.name,
        },
        classAttendance: {
          name: classAttendance.map(
            (classAttendance) => classAttendance.children.name
          ),
        },
        status,
      };
    });

    res.json({ classes: classesData });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch classes." });
  }
};

// POST a new class
export const createClassController = async (req: Request, res: Response) => {
  const { dateTime, instructorId, customerId, childrenIds, status } = req.body;

  // Validation for req.body
  if (!dateTime || !instructorId || !customerId || !childrenIds || !status) {
    return res
      .status(400)
      .json({ error: "There is a missing required field." });
  }

  try {
    const remainingTokens = await calculateRemainingTokens(
      customerId,
      new Date(dateTime),
    );
    if (remainingTokens < 1) {
      return res.status(400).json({ error: "Not enough tokens." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to calculate remaining tokens." });
  }

  try {
    const subscription = await getActiveSubscription(customerId);
    if (!subscription) {
      return res.status(400).json({ error: "No active subscription found." });
    }
    const newClass = await createClass(
      {
        dateTime,
        instructorId,
        customerId,
        status,
        subscriptionId: subscription.id,
      },
      childrenIds
    );

    res.status(201).json(newClass);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to add class." });
  }
};

const calculateTotalTokens = async (customerId: number, now: Date) => {
  const subscription = await getActiveSubscription(customerId);
  if (!subscription) {
    return 0;
  }
  // New tokens are added every month.
  return (
    (now.getUTCMonth() - subscription.startAt.getUTCMonth() + 1) *
    subscription.plan.tokens
  );
};

const calculateRemainingTokens = async (
  customerId: number,
  baseDateTime: Date,
) => {
  const subscription = await getActiveSubscription(customerId);
  if (!subscription) {
    return 0;
  }
  const classesCount = await countClassesOfSubscription(
    subscription.id,
    getEndOfThisMonth(baseDateTime),
  );
  return (await calculateTotalTokens(customerId, baseDateTime)) - classesCount;
};

function getEndOfThisMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(-1);
  d.setUTCHours(23, 59, 59);
  return d;
}

// DELETE a class
export const deleteClassController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const classId = parseInt(id, 10);

  try {
    if (isNaN(classId)) {
      return res.status(400).json({ error: "Invalid class ID." });
    }

    const deletedClass = await deleteClass(classId);

    return res.status(200).json(deletedClass);
  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(500).json({
      error: "Failed to delete class. Please try again later.",
    });
  }
};
