import { Prisma, Status } from "../../generated/prisma";
import { Request, Response } from "express";
import {
  cancelClassById,
  cancelClasses,
  checkDoubleBooking,
  checkChildConflicts,
  createClassesUsingRecurringClassId,
  deleteClass,
  deleteOldClasses,
  getAllClasses,
  getClassesByCustomerId,
  getClassToRebook,
  getExcludedClasses,
  InstructorUnavailableError,
  rebookClass,
  updateClass,
} from "../services/classesService";
import {
  RequestWithParams,
  RequestWithBody,
  RequestWith,
} from "../middlewares/validationMiddleware";
import type {
  ClassIdParams,
  RebookClassRequest,
  CreateClassesForMonthRequest,
  CheckDoubleBookingRequest,
  CheckChildConflictsRequest,
  CancelClassesRequest,
  UpdateAttendanceRequest,
  UpdateClassStatusRequest,
} from "../../../shared/schemas/classes";
import { prisma } from "../../prisma/prismaClient";
import {
  getValidRecurringClasses,
  getSubscriptionByRecurringClassId,
} from "../services/recurringClassesService";
import {
  calculateFirstDate,
  createDatesBetween,
  days,
  formatYearDateTime,
  getFirstDateInMonths,
  getMonthNumber,
  isSameLocalDate,
  nHoursBefore,
} from "../utils/dateUtils";
import { getInstructorContactById } from "../services/instructorsService";
import { getCustomerContactById } from "../services/customersService";
import { getChildrenNamesByIds } from "../services/childrenService";
import {
  sendAdminSameDayRebookEmail,
  sendInstructorSameDayRebookEmail,
} from "../lib/email/mail";
import {
  FREE_TRIAL_BOOKING_HOURS,
  REGULAR_REBOOKING_HOURS,
} from "../utils/commonUtils";
import {
  createAttendances,
  deleteAttendancesByClassId,
} from "../services/classAttendancesService";

// GET all classes along with related instructors and customers data
export const getAllClassesController = async (_: Request, res: Response) => {
  try {
    const classes = await getAllClasses();

    const classesData = classes.map((eachClass) => {
      const { id, dateTime, customer, instructor, status, recurringClassId } =
        eachClass;

      return {
        id,
        dateTime,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        // "Pending" or "declined" free trial classes don't have an instructor, so use fallback values when instructor is missing
        instructor: {
          id: instructor?.id,
          name: instructor?.name,
        },
        status,
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
  req: RequestWithParams<ClassIdParams>,
  res: Response,
) => {
  const id = req.params.id;

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
        recurringClassId,
        rebookableUntil,
        updatedAt,
        classCode,
      } = eachClass;

      return {
        id,
        dateTime,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        // "Pending" or "declined" free trial classes don't have an instructor, so use fallback values when instructor is missing
        instructor: {
          id: instructor?.id,
          name: instructor?.name,
          icon: instructor?.icon,
          classURL: instructor?.classURL,
          nickname: instructor?.nickname,
          meetingId: instructor?.meetingId,
          passcode: instructor?.passcode,
        },
        classAttendance: {
          children: classAttendance.map((classAttendance) => ({
            id: classAttendance.children.id,
            name: classAttendance.children.name,
          })),
        },
        status,
        recurringClassId,
        rebookableUntil,
        updatedAt,
        classCode,
      };
    });

    res.json({ classes: classesData });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch classes." });
  }
};

export type NewClassToRebookType = {
  dateTime: string | Date;
  instructorId: number;
  customerId: number;
  status: "rebooked";
  rebookableUntil: string | Date;
  classCode: string;
  updatedAt: Date;
  isFreeTrial: boolean;
  subscriptionId?: number;
  recurringClassId?: number;
};

type ClassToRebook = {
  status: Status;
  recurringClassId?: number | null;
  rebookableUntil: Date;
  classCode: string;
  isFreeTrial: boolean;
};

class RebookControllerError extends Error {
  status: number;
  errorType: string;

  constructor(status: number, errorType: string) {
    super(errorType);
    this.status = status;
    this.errorType = errorType;
  }
}

const throwRebookError = (status: number, errorType: string): never => {
  throw new RebookControllerError(status, errorType);
};

export const rebookClassController = async (
  req: RequestWith<ClassIdParams, RebookClassRequest>,
  res: Response,
) => {
  const classId = req.params.id;
  const { dateTime, instructorId, customerId, childrenIds } = req.body;

  try {
    const classToRebook = await getRebookTargetClass(classId);
    const subscription = await getSubscriptionForRebook(classToRebook);
    const newClassToRebook = buildRebookClass({
      classToRebook,
      dateTime,
      instructorId,
      customerId,
      subscription,
    });

    const newClass = await rebookClass(
      { id: classId, status: classToRebook.status },
      newClassToRebook,
      [...childrenIds],
    );

    await notifySameDayRebookIfNeeded({
      newClass,
      childrenIds,
      dateTime,
      instructorId,
    });

    res.sendStatus(201);
  } catch (error) {
    const isPrismaError =
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError;
    const prismaErrorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : null;
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : "";

    if (error instanceof InstructorUnavailableError) {
      return res.status(400).json({ errorType: "instructor unavailable" });
    }
    if (error instanceof RebookControllerError) {
      return res.status(error.status).json({ errorType: error.errorType });
    }
    if (
      isPrismaError ||
      prismaErrorCode === "P2002" ||
      prismaErrorCode === "P2034" ||
      prismaErrorCode === "P2028"
    ) {
      if (prismaErrorCode === "P2002") {
        return res.status(400).json({ errorType: "instructor conflict" });
      }
      if (prismaErrorCode === "P2034" || prismaErrorCode === "P2028") {
        return res
          .status(409)
          .json({ errorType: "likely instructor conflict" });
      }
      if (prismaErrorCode === "P2025") {
        return res
          .status(409)
          .json({ errorType: "likely instructor conflict" });
      }
    }
    if (
      message.includes("Unique constraint failed") ||
      message.includes("duplicate key value violates unique constraint")
    ) {
      return res.status(400).json({ errorType: "instructor conflict" });
    }
    if (
      message.includes("TransactionWriteConflict") ||
      message.includes("could not serialize access") ||
      message.includes("SQLSTATE 40001") ||
      message.includes("serialization failure") ||
      message.includes("deadlock detected") ||
      message.includes("transaction is aborted") ||
      message.includes("lock timeout") ||
      message.includes("statement timeout") ||
      message.includes("Transaction API error")
    ) {
      return res.status(409).json({
        errorType: "likely instructor conflict",
      });
    }
    console.error("Error rebooking a class", {
      error,
      context: {
        customerId,
        classId,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

const getRebookTargetClass = async (
  classId: number,
): Promise<ClassToRebook> => {
  const classToRebook = await getClassToRebook(classId);
  const status = classToRebook.status;
  const rebookableUntil = classToRebook.rebookableUntil;
  const classCode = classToRebook.classCode;
  if (
    status === undefined ||
    rebookableUntil == null ||
    classCode === undefined
  ) {
    throwRebookError(400, "invalid class data");
  }

  return {
    status: status as Status,
    recurringClassId: classToRebook.recurringClassId,
    rebookableUntil: rebookableUntil as Date,
    classCode: classCode as string,
    isFreeTrial: !!classToRebook.isFreeTrial,
  };
};

const getSubscriptionForRebook = async (classToRebook: ClassToRebook) => {
  if (classToRebook.isFreeTrial) return null;
  const recurringClassId = classToRebook.recurringClassId;
  if (recurringClassId == null) {
    throwRebookError(400, "invalid class data");
  }

  const ensuredRecurringClassId = recurringClassId as number;
  const subscription = await getSubscriptionByRecurringClassId(
    ensuredRecurringClassId,
  );
  const ensuredSubscription =
    subscription ?? throwRebookError(404, "no subscription");

  const hasEnded = ensuredSubscription.endAt
    ? new Date(ensuredSubscription.endAt) < new Date()
    : false;
  if (hasEnded) {
    throwRebookError(400, "outdated subscription");
  }

  return ensuredSubscription;
};

const buildRebookClass = ({
  classToRebook,
  dateTime,
  instructorId,
  customerId,
  subscription,
}: {
  classToRebook: ClassToRebook;
  dateTime: string | Date;
  instructorId: number;
  customerId: number;
  subscription: Awaited<ReturnType<typeof getSubscriptionForRebook>>;
}): NewClassToRebookType => {
  const targetDate = new Date(dateTime);
  const rebookingDeadline = classToRebook.isFreeTrial
    ? nHoursBefore(FREE_TRIAL_BOOKING_HOURS, targetDate)
    : nHoursBefore(REGULAR_REBOOKING_HOURS, targetDate);
  if (new Date() > rebookingDeadline) {
    throwRebookError(403, "past rebooking deadline");
  }

  const newClass: NewClassToRebookType = {
    dateTime,
    instructorId,
    customerId,
    status: "rebooked",
    rebookableUntil: classToRebook.rebookableUntil,
    classCode: classToRebook.classCode,
    updatedAt: new Date(),
    isFreeTrial: classToRebook.isFreeTrial,
  };

  if (!classToRebook.isFreeTrial) {
    const ensuredSubscription =
      subscription ?? throwRebookError(404, "no subscription");
    newClass.subscriptionId = ensuredSubscription.id;
    newClass.recurringClassId = classToRebook.recurringClassId!;
  }

  return newClass;
};

const notifySameDayRebookIfNeeded = async ({
  newClass,
  childrenIds,
  dateTime,
  instructorId,
}: {
  newClass: Awaited<ReturnType<typeof rebookClass>>;
  childrenIds: number[];
  dateTime: string | Date;
  instructorId: number;
}) => {
  if (!newClass.dateTime) return;
  const isSameDay = isSameLocalDate(newClass.dateTime, "Asia/Tokyo");
  if (!isSameDay) return;

  try {
    const instructor = await getInstructorContactById(newClass.instructorId!);
    const customer = await getCustomerContactById(newClass.customerId);
    const children = await getChildrenNamesByIds(childrenIds);

    if (!instructor || !customer || !children) {
      console.error(
        "Missing required data for sending same-day rebooking emails",
        {
          instructor,
          customer,
          children,
          classId: newClass.id,
        },
      );
      return;
    }

    await sendAdminSameDayRebookEmail({
      classCode: newClass.classCode,
      dateTime: formatYearDateTime(newClass.dateTime),
      instructorName: instructor.name,
      instructorEmail: instructor.email,
      customerName: customer.name,
      customerEmail: customer.email,
      children,
    });

    await sendInstructorSameDayRebookEmail({
      classCode: newClass.classCode,
      dateTime: formatYearDateTime(newClass.dateTime, "en-US"),
      instructorName: instructor.name,
      instructorEmail: instructor.email,
      children,
    });
  } catch (emailError) {
    console.error("Failed to send same-day rebooking notification email", {
      emailError,
      context: {
        emailError,
        classId: newClass.id,
        classDate: dateTime,
        instructorId,
        time: new Date().toISOString(),
      },
    });
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
export const deleteClassController = async (
  req: RequestWithParams<ClassIdParams>,
  res: Response,
) => {
  const classId = req.params.id;

  try {
    const deletedClass = await deleteClass(classId);

    return res.status(200).json(deletedClass);
  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(500).json({
      error: "Failed to delete class. Please try again later.",
    });
  }
};

// Cancel a class
export const cancelClassController = async (
  req: RequestWithParams<ClassIdParams>,
  res: Response,
) => {
  const classId = req.params.id;

  try {
    await cancelClassById(classId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error canceling a class", {
      error,
      context: {
        classId,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const createClassesForMonthController = async (
  req: RequestWithBody<CreateClassesForMonthRequest>,
  res: Response,
) => {
  const { year, month } = req.body;

  try {
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
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
                excludedClass.dateTime!, // All "excludedClasses" are selected by dateTime, so dateTime is guaranteed to exist.
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
      },
    );

    res.status(201).json({ result });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to add class." });
  }
};

// Check if there is a class that is already booked at the same dateTime as the newly booked class
export const checkDoubleBookingController = async (
  req: RequestWithBody<CheckDoubleBookingRequest>,
  res: Response,
) => {
  const { customerId, dateTime } = req.body;

  try {
    const isDoubleBooked = await checkDoubleBooking(customerId, dateTime);

    res.status(200).json(isDoubleBooked);
  } catch (error) {
    console.error("Error checking double booking", {
      error,
      context: {
        customerId,
        dateTime,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const checkChildConflictsController = async (
  req: RequestWithBody<CheckChildConflictsRequest>,
  res: Response,
) => {
  const { dateTime, selectedChildrenIds } = req.body;

  try {
    const conflictingChildren = await checkChildConflicts(
      dateTime,
      selectedChildrenIds,
    );

    res.status(200).json(conflictingChildren);
  } catch (error) {
    console.error("Error checking children conflicts", {
      error,
      context: {
        childrenIds: selectedChildrenIds,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const cancelClassesController = async (
  req: RequestWithBody<CancelClassesRequest>,
  res: Response,
) => {
  const { classIds } = req.body;

  try {
    await cancelClasses(classIds);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error canceling classes", {
      error,
      context: {
        classIds,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const updateAttendanceController = async (
  req: RequestWith<ClassIdParams, UpdateAttendanceRequest>,
  res: Response,
) => {
  const classId = req.params.id;
  const { childrenIds } = req.body;

  try {
    if (childrenIds.length === 0) {
      await deleteAttendancesByClassId(classId);
    } else {
      await prisma.$transaction(async (tx) => {
        await deleteAttendancesByClassId(classId, tx);
        await createAttendances(classId, childrenIds, tx);
      });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error updating class attendance", {
      error,
      context: {
        classId,
        childrenIds,
        time: new Date().toISOString(),
      },
    });
    return res.sendStatus(500);
  }
};

export const updateClassStatusController = async (
  req: RequestWith<ClassIdParams, UpdateClassStatusRequest>,
  res: Response,
) => {
  const classId = req.params.id;
  const { status } = req.body;

  try {
    const classToUpdate = await getClassToRebook(classId);
    const classDateTime = classToUpdate.dateTime;

    if (!classToUpdate || !classDateTime) {
      return res.sendStatus(404);
    }

    await updateClass(classId, status, classDateTime);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error updating class status", {
      error,
      context: {
        classId,
        time: new Date().toISOString(),
      },
    });
    return res.sendStatus(500);
  }
};

// Delete classes older than 1 year (13 months)
export const deleteOldClassesController = async (_: Request, res: Response) => {
  try {
    const deletedClasses = await deleteOldClasses();
    res.status(200).json({ deletedClasses });
  } catch (error) {
    console.error("Error deleting old classes", {
      error,
      context: {
        time: new Date().toISOString(),
      },
    });
  }
};
