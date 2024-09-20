"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkChildrenAvailabilityController =
  exports.checkDoubleBookingController =
  exports.createClassesForMonthController =
  exports.getInstructorClasses =
  exports.nonRebookableCancelController =
  exports.cancelClassController =
  exports.getClassesForCustomerCalendar =
  exports.getClassesForInstructorCalendar =
  exports.updateClassController =
  exports.getClassByIdController =
  exports.deleteClassController =
  exports.createClassController =
  exports.getClassesByCustomerIdController =
  exports.getAllClassesController =
    void 0;
const classesService_1 = require("../services/classesService");
const subscriptionsService_1 = require("../services/subscriptionsService");
const prismaClient_1 = require("../../prisma/prismaClient");
const recurringClassesService_1 = require("../services/recurringClassesService");
const dateUtils_1 = require("../helper/dateUtils");
// GET all classes along with related instructors and customers data
const getAllClassesController = (_, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const classes = yield (0, classesService_1.getAllClasses)();
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
  });
exports.getAllClassesController = getAllClassesController;
// GET classes by customer id along with related instructors and customers data
const getClassesByCustomerIdController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
      const classes = yield (0, classesService_1.getClassesByCustomerId)(id);
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
  });
exports.getClassesByCustomerIdController = getClassesByCustomerIdController;
// POST a new class
const createClassController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
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
    const missingFields = [];
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
      const subscriptionId = yield prismaClient_1.prisma.$transaction((tx) =>
        __awaiter(void 0, void 0, void 0, function* () {
          const recurringClass = yield (0,
          recurringClassesService_1.getRecurringClassByRecurringClassId)(
            tx,
            recurringClassId,
          );
          if (!recurringClass) {
            throw new Error("Recurring class not found.");
          }
          return recurringClass.subscriptionId;
        }),
      );
      if (!subscriptionId) {
        return res.status(400).json({ error: "No subscription found." });
      }
      // Get subscription by subscription id
      const subscription = yield (0,
      subscriptionsService_1.getSubscriptionById)(subscriptionId);
      if (!subscription) {
        return res
          .status(400)
          .json({ error: "No applicable subscription found." });
      }
      // Check if the selected instructor is already booked at the selected date and time
      const instructorBooked = yield (0, classesService_1.isInstructorBooked)(
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
      const [newClass, updatedClass] = yield Promise.all([
        // Create a new Booked Class
        (0, classesService_1.createClass)(
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
        (0, classesService_1.updateClass)(
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
  });
exports.createClassController = createClassController;
function getEndOfThisMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(-1);
  d.setUTCHours(23, 59, 59);
  return d;
}
// DELETE a class
const deleteClassController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const classId = parseInt(id, 10);
    try {
      if (isNaN(classId)) {
        return res.status(400).json({ error: "Invalid class ID." });
      }
      const deletedClass = yield (0, classesService_1.deleteClass)(classId);
      return res.status(200).json(deletedClass);
    } catch (error) {
      console.error("Controller Error:", error);
      return res.status(500).json({
        error: "Failed to delete class. Please try again later.",
      });
    }
  });
exports.deleteClassController = deleteClassController;
// GET a class by class id along with related instructors, customers, and children data
const getClassByIdController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const classId = Number(req.params.id);
    if (isNaN(classId)) {
      return res.status(400).json({ error: "Invalid class ID" });
    }
    try {
      const classData = yield (0, classesService_1.getClassById)(classId);
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
  });
exports.getClassByIdController = getClassByIdController;
// Update[Edit] a class
const updateClassController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const classId = parseInt(req.params.id);
    const { dateTime, instructorId, childrenIds, status, isRebookable } =
      req.body;
    try {
      const updatedClass = yield (0, classesService_1.updateClass)(
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
  });
exports.updateClassController = updateClassController;
// GET class data for the calendar by an instructor id
const getClassesForInstructorCalendar = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const instructorId = parseInt(req.params.instructorId);
    if (!instructorId) {
      return res.status(400).json({ error: "instructorId is required" });
    }
    try {
      const classes = yield (0, classesService_1.getClassesForCalendar)(
        instructorId,
        "instructor",
      );
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
  });
exports.getClassesForInstructorCalendar = getClassesForInstructorCalendar;
// GET class data for the calendar by a customer id
const getClassesForCustomerCalendar = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const customerId = parseInt(req.params.customerId);
    if (!customerId) {
      return res.status(400).json({ error: "customerIdId is required" });
    }
    try {
      const classes = yield (0, classesService_1.getClassesForCalendar)(
        customerId,
        "customer",
      );
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
  });
exports.getClassesForCustomerCalendar = getClassesForCustomerCalendar;
// Cancel a class
const cancelClassController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const classId = parseInt(req.params.id);
    const isPastPrevDayDeadline = false;
    try {
      yield (0, classesService_1.cancelClassById)(
        classId,
        isPastPrevDayDeadline,
      );
      res.status(200).json({ message: "Class canceled successfully" });
    } catch (error) {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  });
exports.cancelClassController = cancelClassController;
// Cancel a class on the same day of the class
const nonRebookableCancelController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const classId = parseInt(req.params.id);
    const isPastPrevDayDeadline = true;
    try {
      yield (0, classesService_1.cancelClassById)(
        classId,
        isPastPrevDayDeadline,
      );
      res.status(200).json({ message: "Class canceled successfully" });
    } catch (error) {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  });
exports.nonRebookableCancelController = nonRebookableCancelController;
const getInstructorClasses = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const classes = yield (0, classesService_1.fetchInstructorClasses)(
        req.id,
      );
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
          customerName: customer.name,
          classURL: instructor.classURL,
          meetingId: instructor.meetingId,
          passcode: instructor.passcode,
          attendingChildren: classAttendance.map((classAttendance) => ({
            id: classAttendance.children.id,
            name: classAttendance.children.name,
            birthdate: classAttendance.children.birthdate,
            personalInfo: classAttendance.children.personalInfo,
          })),
          customerChildren: customer.children.map((child) => ({
            id: child.id,
            name: child.name,
            birthdate: child.birthdate,
            personalInfo: child.personalInfo,
          })),
          status,
          isRebookable,
        };
      });
      res.json({ classes: classesData });
    } catch (error) {
      console.error("Controller Error:", error);
      res.status(500).json({ error: "Failed to fetch classes." });
    }
  });
exports.getInstructorClasses = getInstructorClasses;
const createClassesForMonthController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { year, month } = req.body;
    if (!year || !month) {
      return res.status(400).json({ error: "Invalid year or month." });
    }
    try {
      const result = yield prismaClient_1.prisma.$transaction((tx) =>
        __awaiter(void 0, void 0, void 0, function* () {
          // First date of a giving month.
          const monthNum = (0, dateUtils_1.getMonthNumber)(month);
          if (monthNum === -1) throw new Error("Invalid month");
          const firstDateOfMonth = new Date(Date.UTC(year, monthNum, 1));
          // Get valid recurring classes.
          const recurringClasses = yield (0,
          recurringClassesService_1.getValidRecurringClasses)(
            tx,
            firstDateOfMonth,
          );
          // Get excluded classes.
          const recurringClassIds = recurringClasses.map(
            (recurringClass) => recurringClass.id,
          );
          const excludedClasses = yield (0,
          classesService_1.getExcludedClasses)(
            tx,
            recurringClassIds,
            firstDateOfMonth,
          );
          // TODO: Get the instructors' unavailability and exclude it.
          // TODO: Get the holiday and exclude it.
          // Define until when schedule should be created.
          const until = (0, dateUtils_1.getFirstDateInMonths)(
            firstDateOfMonth,
            1,
          );
          until.setUTCDate(until.getUTCDate() - 1);
          // Repeat the number of recurring classes.
          yield Promise.all(
            recurringClasses.map((recurringClass) =>
              __awaiter(void 0, void 0, void 0, function* () {
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
                const minutes = startAt
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                const time = `${hours}:${minutes}`;
                // Get the first date of the class of the month
                const firstDate = (0, dateUtils_1.calculateFirstDate)(
                  firstDateOfMonth,
                  dateUtils_1.days[startAt.getDay()],
                  time,
                );
                // Create the range of dates.
                const dateTimes = (0, dateUtils_1.createDatesBetween)(
                  firstDate,
                  endAt && endAt < until ? endAt : until,
                );
                // if you find the same dateTime and instructor id as in the excludedClass, skip it.
                const isExistingClass = excludedClasses.some(
                  (excludedClass) => {
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
                  },
                );
                if (isExistingClass) {
                  return;
                }
                const childrenIds = recurringClassAttendance.map(
                  (attendee) => attendee.childrenId,
                );
                // Create the classes and its attendance based on the recurring id.
                yield (0, classesService_1.createClassesUsingRecurringClassId)(
                  tx,
                  id,
                  instructorId,
                  subscription.customerId,
                  subscriptionId,
                  childrenIds,
                  dateTimes,
                );
              }),
            ),
          );
          return recurringClasses;
        }),
      );
      res.status(201).json({ result });
    } catch (error) {
      console.error("Controller Error:", error);
      res.status(500).json({ error: "Failed to add class." });
    }
  });
exports.createClassesForMonthController = createClassesForMonthController;
// Check if there is a class that is already booked at the same dateTime as the newlly booked class
const checkDoubleBookingController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { customerId, dateTime } = req.body;
    if (!customerId || !dateTime) {
      return res
        .status(400)
        .json({ error: "customerId and dateTime are required." });
    }
    try {
      const isBooked = yield (0, classesService_1.checkDoubleBooking)(
        customerId,
        dateTime,
      );
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
  });
exports.checkDoubleBookingController = checkDoubleBookingController;
const checkChildrenAvailabilityController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { dateTime, selectedChildrenIds } = req.body;
    if (!dateTime || !selectedChildrenIds) {
      return res
        .status(400)
        .json({ error: "dateTime and selectedChildrenIds are required." });
    }
    try {
      const childrenWithConflictingClasses = yield (0,
      classesService_1.checkForChildrenWithConflictingClasses)(
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
  });
exports.checkChildrenAvailabilityController =
  checkChildrenAvailabilityController;
