import { Request, Response } from "express";
import {
  countClassesOfSubscription,
  addRecurringClass,
  createClass,
  deleteClass,
  getAllClasses,
  getClassById,
  getClassesByCustomerId,
  updateClass,
  getRecurringClassesBySubscriptionId,
} from "../services/classesService";
import { getActiveSubscription } from "../services/subscriptionsService";
import { RRule } from "rrule";
import { getEndOfNextMonth } from "../helper/commonUtils";

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
  res: Response,
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
          children: classAttendance.map((classAttendance) => ({
            id: classAttendance.children.id,
            name: classAttendance.children.name,
          })),
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
      childrenIds,
    );

    res.status(201).json(newClass);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to add class." });
  }
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

// GET a class by class id along with related instructors, customers, and children data
export const getClassByIdController = async (req: Request, res: Response) => {
  const classId = Number(req.params.id);

  if (isNaN(classId)) {
    return res.status(400).json({ error: "Invalid class ID" });
  }

  try {
    const classData = await getClassById(classId);

    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }

    const formattedClassData = {
      id: classData.id,
      dateTime: classData.dateTime,
      customer: {
        id: classData.customer.id,
        name: classData.customer.name,
        email: classData.customer.email,
      },
      instructor: {
        id: classData.instructor.id,
        name: classData.instructor.name,
      },
      classAttendance: {
        children: classData.classAttendance.map((classAttendance) => ({
          id: classAttendance.children.id,
          name: classAttendance.children.name,
        })),
      },
      status: classData.status,
    };

    res.json(formattedClassData);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch a class." });
  }
};

// Update[Edit] a class
export const updateClassController = async (req: Request, res: Response) => {
  const classId = Number(req.params.id);
  const { dateTime, instructorId, childrenIds } = req.body;

  try {
    const updatedClass = await updateClass(
      classId,
      dateTime,
      instructorId,
      childrenIds,
    );

    res.status(200).json({
      message: "Class is updated successfully",
      updatedClass,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// POST a recurring class
export const addRecurringClassController = async (
  req: Request,
  res: Response,
) => {
  const { instructorId, customerId, childrenIds, subscriptionId, dateTime } =
    req.body;
  if (
    !instructorId ||
    !customerId ||
    !childrenIds ||
    !subscriptionId ||
    !dateTime
  ) {
    return res.status(400).json({ message: "Values are not found" });
  }

  const date = new Date(dateTime);
  const rrule = new RRule({
    freq: RRule.WEEKLY,
    dtstart: date,
  });

  // Generate the recurring class until the end of next month
  const dateTimes = rrule.between(date, getEndOfNextMonth(date), true);

  try {
    const recurringClass = await addRecurringClass(
      instructorId,
      customerId,
      childrenIds,
      subscriptionId,
      rrule.toString(),
      dateTimes,
    );

    res.status(200).json({
      message: "Recurring class is created successfully",
      recurringClass,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// GET recurring classes by customer id along with related subscriptions, customers and instructors data
export const getRecurringClassesBySubscriptionIdController = async (
  req: Request,
  res: Response,
) => {
  const subscriptionId = parseInt(req.query.subscriptionId as string);
  if (isNaN(subscriptionId)) {
    res.status(400).json({ error: "Invalid customer ID" });
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
