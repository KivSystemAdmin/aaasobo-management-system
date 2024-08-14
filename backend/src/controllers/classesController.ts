import { Request, Response } from "express";
import {
  cancelClassById,
  checkDoubleBooking,
  checkForChildrenWithConflictingClasses,
  createClass,
  createClassesUsingRecurringClassId,
  deleteClass,
  fetchInstructorClasses,
  getAllClasses,
  getClassById,
  getClassesByCustomerId,
  getClassesForCalendar,
  getExcludedClasses,
  isInstructorBooked,
  updateClass,
} from "../services/classesService";
import { getSubscriptionById } from "../services/subscriptionsService";
import { RequestWithId } from "../middlewares/parseId.middleware";
import { prisma } from "../../prisma/prismaClient";
import {
  getValidRecurringClasses,
  getRecurringClassByRecurringClassId,
} from "../services/recurringClassesService";
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
      const {
        id,
        dateTime,
        customer,
        instructor,
        status,
        isRebookable,
        recurringClassId,
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
        },
        status,
        isRebookable,
        recurringClassId,
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
        recurringClassId,
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
        recurringClassId,
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
  const {
    classId,
    dateTime,
    instructorId,
    customerId,
    childrenIds,
    status,
    recurringClassId,
  } = req.body;

  // Check for missing fields
  const missingFields: string[] = [];
  if (!classId) missingFields.push("classId");
  if (!dateTime) missingFields.push("dateTime");
  if (!instructorId) missingFields.push("instructorId");
  if (!customerId) missingFields.push("customerId");
  if (!childrenIds) missingFields.push("childrenIds");
  if (!status) missingFields.push("status");
  if (!recurringClassId) missingFields.push("recurringClassId");

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required field(s): ${missingFields.join(", ")}`,
    });
  }

  try {
    // Get subscription id from recurringClass table
    const subscriptionId = await prisma.$transaction(async (tx) => {
      const recurringClass = await getRecurringClassByRecurringClassId(
        tx,
        recurringClassId,
      );
      if (!recurringClass) {
        throw new Error("Recurring class not found.");
      }
      return recurringClass.subscriptionId;
    });

    if (!subscriptionId) {
      return res.status(400).json({ error: "No subscription found." });
    }

    // Get subscription by subscription id
    const subscription = await getSubscriptionById(subscriptionId);

    if (!subscription) {
      return res
        .status(400)
        .json({ error: "No applicable subscription found." });
    }

    // Check if the selected instructor is already booked at the selected date and time
    const instructorBooked: boolean = await isInstructorBooked(
      instructorId,
      dateTime,
    );
    if (instructorBooked) {
      return res.status(400).json({
        error:
          "This instructor is already booked at the selected time. Please refresh your browser and try booking for a different time slot.",
      });
    }

    const isRebookable = false;
    const [newClass, updatedClass] = await Promise.all([
      // Create a new Booked Class
      createClass(
        {
          dateTime,
          instructorId,
          customerId,
          status,
          subscriptionId: subscription.id,
          recurringClassId,
        },
        childrenIds,
      ),
      // Upgrade the CanceledByCustomer class that was rebooked => isRebookable: false
      updateClass(
        classId,
        undefined, // dateTime
        undefined, // instructorId
        undefined, // childrenIds
        undefined, // status
        isRebookable,
      ),
    ]);

    res.status(201).json({ newClass, updatedClass });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to book class." });
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
  const classId = parseInt(req.params.id);
  const { dateTime, instructorId, childrenIds, status, isRebookable } =
    req.body;

  try {
    const updatedClass = await updateClass(
      classId,
      dateTime,
      instructorId,
      childrenIds,
      status,
      isRebookable,
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
      const {
        id,
        dateTime,
        instructor,
        status,
        classAttendance,
        isRebookable,
      } = eachClass;

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
        isRebookable,
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

export const getInstructorClasses = async (
  req: RequestWithId,
  res: Response,
) => {
  try {
    const classes = await fetchInstructorClasses(req.id);

    const classesData = classes.map((eachClass) => {
      const {
        id,
        dateTime,
        customer,
        instructor,
        status,
        classAttendance,
        isRebookable,
        recurringClass,
      } = eachClass;

      return {
        id,
        dateTime,
        customerName: customer.name,
        classURL: instructor.classURL,
        meetingId: instructor.meetingId,
        passcode: instructor.passcode,
        children: classAttendance.map((classAttendance) => ({
          id: classAttendance.children.id,
          name: classAttendance.children.name,
          birthdate: classAttendance.children.birthdate,
          personalInfo: classAttendance.children.personalInfo,
        })),
        attendingChildren: recurringClass?.recurringClassAttendance.map(
          (attendance) => ({
            id: attendance.children.id,
            name: attendance.children.name,
            birthdate: attendance.children.birthdate,
            personalInfo: attendance.children.personalInfo,
          }),
        ),
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

// Check if there is a class that is already booked at the same dateTime as the newlly booked class
export const checkDoubleBookingController = async (
  req: Request,
  res: Response,
) => {
  const { customerId, dateTime } = req.body;

  if (!customerId || !dateTime) {
    return res
      .status(400)
      .json({ error: "customerId and dateTime are required." });
  }

  try {
    const isBooked = await checkDoubleBooking(customerId, dateTime);

    if (isBooked) {
      return res.status(400).json({
        error: "A class has already been booked at the selected time.",
      });
    }

    // No booking found
    res.status(200).json({ message: "No booked classes found." });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to check class booking." });
  }
};

export const checkChildrenAvailabilityController = async (
  req: Request,
  res: Response,
) => {
  const { dateTime, selectedChildrenIds } = req.body;

  if (!dateTime || !selectedChildrenIds) {
    return res
      .status(400)
      .json({ error: "dateTime and selectedChildrenIds are required." });
  }

  try {
    const childrenWithConflictingClasses =
      await checkForChildrenWithConflictingClasses(
        new Date(dateTime),
        selectedChildrenIds,
      );

    if (childrenWithConflictingClasses.length > 0) {
      const childrenNames = childrenWithConflictingClasses.join(", ");
      const conflictMessage = `Child(ren) ${childrenNames} already has/have another class with another instructor at the selected time.`;

      return res.status(400).json({
        error: conflictMessage,
      });
    }

    // No conflicts found
    res.status(200).json({ message: "No conflicting classes found." });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to check children availability." });
  }
};
