import { Request, Response } from "express";
import {
  cancelClassById,
  createClass,
  createClassesUsingRecurringClassId,
  deleteClass,
  getAllClasses,
  getClassById,
  getClassesByCustomerId,
  getClassesForCalendar,
  getExcludedClasses,
  updateClass,
} from "../services/classesService";
import { getActiveSubscription } from "../services/subscriptionsService";
import { prisma } from "../../prisma/prismaClient";
import { getValidRecurringClasses } from "../services/recurringClassesService";
import {
  calculateFirstDate,
  createDatesBetween,
  days,
  getFirstDateInMonths,
  getMonthNumber,
} from "../helper/dateUtils";

// GET all classes along with related instructors and customers data
export const getAllClassesController = async (_: Request, res: Response) => {
  try {
    const classes = await getAllClasses();

    const classesData = classes.map((eachClass) => {
      const { id, dateTime, customer, instructor, status, isRebookable } =
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
        status,
        isRebookable,
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
      const {
        id,
        dateTime,
        customer,
        instructor,
        status,
        classAttendance,
        isRebookable,
      } = eachClass;

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
          icon: instructor.icon,
          classURL: instructor.classURL,
          nickname: instructor.nickname,
          meetingId: instructor.meetingId,
          passcode: instructor.passcode,
        },
        classAttendance: {
          children: classAttendance.map((classAttendance) => ({
            id: classAttendance.children.id,
            name: classAttendance.children.name,
          })),
        },
        status,
        isRebookable,
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
        icon: classData.instructor.icon,
        classURL: classData.instructor.classURL,
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

// GET class data for the calendar by an instructor id
export const getClassesForInstructorCalendar = async (
  req: Request,
  res: Response,
) => {
  const instructorId = parseInt(req.params.instructorId);

  if (!instructorId) {
    return res.status(400).json({ error: "instructorId is required" });
  }

  try {
    const classes = await getClassesForCalendar(instructorId, "instructor");

    const classesData = classes.map((eachClass) => {
      const { id, dateTime, status, classAttendance } = eachClass;

      return {
        id,
        dateTime,
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
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
};

// GET class data for the calendar by a customer id
export const getClassesForCustomerCalendar = async (
  req: Request,
  res: Response,
) => {
  const customerId = parseInt(req.params.customerId);

  if (!customerId) {
    return res.status(400).json({ error: "customerIdId is required" });
  }

  try {
    const classes = await getClassesForCalendar(customerId, "customer");

    const classesData = classes.map((eachClass) => {
      const { id, dateTime, instructor, status, classAttendance } = eachClass;

      return {
        id,
        dateTime,
        instructor: {
          id: instructor.id,
          name: instructor.name,
          nickname: instructor.nickname,
          icon: instructor.icon,
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
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
};

// Cancel a class
export const cancelClassController = async (req: Request, res: Response) => {
  const classId = parseInt(req.params.id);
  const isPastPrevDayDeadline = false;

  try {
    await cancelClassById(classId, isPastPrevDayDeadline);
    res.status(200).json({ message: "Class canceled successfully" });
  } catch (error) {
    res.status(500).json({ error: "An unknown error occurred" });
  }
};

// Cancel a class on the same day of the class
export const nonRebookableCancelController = async (
  req: Request,
  res: Response,
) => {
  const classId = parseInt(req.params.id);
  const isPastPrevDayDeadline = true;

  try {
    await cancelClassById(classId, isPastPrevDayDeadline);
    res.status(200).json({ message: "Class canceled successfully" });
  } catch (error) {
    res.status(500).json({ error: "An unknown error occurred" });
  }
};

export const createClassesForMonthController = async (
  req: Request,
  res: Response,
) => {
  const { year, month } = req.body;
  if (!year || !month) {
    return res.status(400).json({ error: "Invalid year or month." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // First date of a giving month.
      const monthNum = getMonthNumber(month);
      if (monthNum === -1) throw new Error("Invalid month");
      const firstDateOfMonth = new Date(Date.UTC(year, monthNum, 1));

      // Get valid recurring classes.
      const recurringClasses = await getValidRecurringClasses(
        tx,
        firstDateOfMonth,
      );

      // Get excluded classes.
      const recurringClassIds = recurringClasses.map(
        (recurringClass) => recurringClass.id,
      );
      const excludedClasses = await getExcludedClasses(
        tx,
        recurringClassIds,
        firstDateOfMonth,
      );

      // TODO: Get the instructors' unavailability and exclude it.
      // TODO: Get the holiday and exclude it.

      // Define until when schedule should be created.
      const until = getFirstDateInMonths(firstDateOfMonth, 1);
      until.setUTCDate(until.getUTCDate() - 1);

      // Repeat the number of recurring classes.
      await Promise.all(
        recurringClasses.map(async (recurringClass) => {
          const {
            id,
            instructorId,
            startAt,
            endAt,
            subscriptionId,
            subscription,
            recurringClassAttendance,
          } = recurringClass;

          // If the applicable property is null, skip it.
          if (
            instructorId === null ||
            startAt === null ||
            subscriptionId == null ||
            subscription === null
          ) {
            return;
          }

          // If startAt is earlier than firstDateOfMonth, skip it.
          if (startAt && firstDateOfMonth < new Date(startAt)) {
            return;
          }

          // Extract time from startAt
          const hours = startAt.getHours().toString().padStart(2, "0");
          const minutes = startAt.getMinutes().toString().padStart(2, "0");
          const time = `${hours}:${minutes}`;

          // Get the first date of the class of the month
          const firstDate = calculateFirstDate(
            firstDateOfMonth,
            days[startAt.getDay()],
            time,
          );

          // Create the range of dates.
          const dateTimes = createDatesBetween(
            firstDate,
            endAt && endAt < until ? endAt : until,
          );

          // if you find the same dateTime and instructor id as in the excludedClass, skip it.
          const isExistingClass = excludedClasses.some((excludedClass) => {
            const excludedClassDateTimesStr = new Date(
              excludedClass.dateTime,
            ).toISOString();
            const dateTimesStr = dateTimes.map((date) =>
              new Date(date).toISOString(),
            );
            return (
              dateTimesStr.includes(excludedClassDateTimesStr) &&
              excludedClass.instructorId === instructorId
            );
          });
          if (isExistingClass) {
            return;
          }

          const childrenIds = recurringClassAttendance.map(
            (attendee) => attendee.childrenId,
          );

          // Create the classes and its attendance based on the recurring id.
          await createClassesUsingRecurringClassId(
            tx,
            id,
            instructorId,
            subscription.customerId,
            subscriptionId,
            childrenIds,
            dateTimes,
          );
        }),
      );

      return recurringClasses;
    });

    res.status(201).json({ result });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to add class." });
  }
};
