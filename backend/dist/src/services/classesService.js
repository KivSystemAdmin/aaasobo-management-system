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
exports.checkDoubleBooking =
  exports.checkForChildrenWithConflictingClasses =
  exports.isInstructorBooked =
  exports.getExcludedClasses =
  exports.createClassesUsingRecurringClassId =
  exports.fetchInstructorClasses =
  exports.cancelClassById =
  exports.getClassesForCalendar =
  exports.countClassesOfSubscription =
  exports.updateClass =
  exports.getClassById =
  exports.checkIfChildHasCompletedClass =
  exports.checkIfChildHasBookedClass =
  exports.deleteClass =
  exports.createClass =
  exports.getClassesByCustomerId =
  exports.getAllClasses =
    void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
// Fetch all the classes with related instructors and customers data
const getAllClasses = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const classes = yield prismaClient_1.prisma.class.findMany({
        include: { instructor: true, customer: true },
        orderBy: { dateTime: "desc" },
      });
      return classes;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch classes.");
    }
  });
exports.getAllClasses = getAllClasses;
// Fetch classes by customer id along with related instructors and customers data
const getClassesByCustomerId = (customerId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const classes = yield prismaClient_1.prisma.class.findMany({
        where: { customerId },
        include: {
          instructor: true,
          customer: true,
          classAttendance: { include: { children: true } },
        },
        orderBy: { dateTime: "asc" },
      });
      return classes;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch classes.");
    }
  });
exports.getClassesByCustomerId = getClassesByCustomerId;
// Create a new class in the DB
const createClass = (classData, childrenIds) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const CreatedClass = yield prismaClient_1.prisma.class.create({
        data: classData,
      });
      const classAttendancePromises = childrenIds.map((childrenId) => {
        return prismaClient_1.prisma.classAttendance.create({
          data: {
            classId: CreatedClass.id,
            childrenId,
          },
        });
      });
      const classAttendance = yield Promise.all(classAttendancePromises);
      return { CreatedClass, classAttendance };
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to add class.");
    }
  });
exports.createClass = createClass;
// Delete a class in the DB
const deleteClass = (classId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      yield prismaClient_1.prisma.classAttendance.deleteMany({
        where: { classId },
      });
      const deletedClass = yield prismaClient_1.prisma.class.delete({
        where: { id: classId },
      });
      return deletedClass;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to delete class.");
    }
  });
exports.deleteClass = deleteClass;
// Check if a child has a booked class by the child's id
const checkIfChildHasBookedClass = (tx, childId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const bookedClass = yield tx.classAttendance.findFirst({
        where: { childrenId: childId, class: { status: "booked" } },
      });
      // Return true if a booked class was found, otherwise false
      return bookedClass !== null;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to check if a child has a booked class.");
    }
  });
exports.checkIfChildHasBookedClass = checkIfChildHasBookedClass;
// Check if a child has a completed class by the child's id
const checkIfChildHasCompletedClass = (tx, childId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const completedClass = yield tx.classAttendance.findFirst({
        where: { childrenId: childId, class: { status: "completed" } },
      });
      // Return true if a completed class was found, otherwise false
      return completedClass !== null;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to check if a child has a completed class.");
    }
  });
exports.checkIfChildHasCompletedClass = checkIfChildHasCompletedClass;
// Fetch a class by class id along with related instructors, customers, and children data
const getClassById = (classId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const classData = yield prismaClient_1.prisma.class.findUnique({
        where: { id: classId },
        include: {
          instructor: true,
          customer: true,
          classAttendance: { include: { children: true } },
        },
      });
      return classData;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch a class.");
    }
  });
exports.getClassById = getClassById;
// Update/Edit a class
const updateClass = (
  classId,
  dateTime,
  instructorId,
  childrenIds,
  status,
  isRebookable,
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const updatedClass = yield prismaClient_1.prisma.$transaction((prisma) =>
        __awaiter(void 0, void 0, void 0, function* () {
          // Update the Class data
          const updatedClass = yield prisma.class.update({
            where: { id: classId },
            data: {
              dateTime,
              instructorId,
              status,
              isRebookable,
            },
          });
          // Delete existing classAttendance records
          yield prisma.classAttendance.deleteMany({
            where: { classId },
          });
          // Add new classAttendance records if childrenIds is provided
          if (childrenIds) {
            yield prisma.classAttendance.createMany({
              data: childrenIds.map((childId) => ({
                classId,
                childrenId: childId,
              })),
            });
          }
          return updatedClass;
        }),
      );
      return updatedClass;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to update a class.");
    }
  });
exports.updateClass = updateClass;
function countClassesOfSubscription(subscriptionId, until) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.class.count({
        where: {
          subscriptionId,
          OR: [{ status: "booked" }, { status: "completed" }],
          dateTime: { lte: until },
        },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to count lessons.");
    }
  });
}
exports.countClassesOfSubscription = countClassesOfSubscription;
// Fetches class data for the calendar based on user type (instructor or customer), including/excluding related details as needed.
const getClassesForCalendar = (userId, userType) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const includeOptions = {
        instructor: userType === "customer",
        classAttendance: { include: { children: true } },
      };
      const whereCondition =
        userType === "instructor"
          ? { instructorId: userId }
          : { customerId: userId };
      const classes = yield prismaClient_1.prisma.class.findMany({
        where: whereCondition,
        include: includeOptions,
        orderBy: { dateTime: "desc" },
      });
      return classes;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch classes.");
    }
  });
exports.getClassesForCalendar = getClassesForCalendar;
// Cancel a class
const cancelClassById = (classId, isPastPrevDayDeadline) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const classToUpdate = yield prismaClient_1.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classToUpdate) {
      throw new Error("Class not found");
    }
    if (classToUpdate.status !== "booked") {
      throw new Error("Class cannot be canceled");
    }
    // Use a transaction to ensure both operations succeed or fail together
    yield prismaClient_1.prisma.$transaction((prisma) =>
      __awaiter(void 0, void 0, void 0, function* () {
        // Delete class attendance records
        yield prisma.classAttendance.deleteMany({
          where: { classId },
        });
        // If classes are canceled before the class dates (!isPastPrevDayDeadline), they can be rescheduled (isRebookable: true).
        // Otherwise (isPastPrevDayDeadline), not (isRebookable: false)
        if (!isPastPrevDayDeadline) {
          yield prisma.class.update({
            where: { id: classId },
            data: { status: "canceledByCustomer" },
          });
        } else {
          yield prisma.class.update({
            where: { id: classId },
            data: { status: "canceledByCustomer", isRebookable: false },
          });
        }
      }),
    );
  });
exports.cancelClassById = cancelClassById;
const fetchInstructorClasses = (instructorId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const classes = yield prismaClient_1.prisma.class.findMany({
        where: { instructorId },
        include: {
          instructor: true,
          customer: {
            include: {
              children: true,
            },
          },
          classAttendance: { include: { children: true } },
        },
        orderBy: { dateTime: "asc" },
      });
      return classes;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch classes.");
    }
  });
exports.fetchInstructorClasses = fetchInstructorClasses;
// Create classes based on the recurring class id
const createClassesUsingRecurringClassId = (
  tx,
  recurringClassId,
  instructorId,
  customerId,
  subscriptionId,
  childrenIds,
  dateTimes,
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const createdClasses = yield tx.class.createManyAndReturn({
        data: dateTimes.map((dateTime) => {
          return {
            recurringClassId,
            instructorId,
            customerId,
            subscriptionId,
            status: "booked",
            dateTime,
          };
        }),
      });
      yield tx.classAttendance.createMany({
        data: createdClasses
          .map((createdClass) => {
            return childrenIds.map((childrenId) => ({
              classId: createdClass.id,
              childrenId,
            }));
          })
          .flat(),
      });
      return { createdClasses };
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to add classes.");
    }
  });
exports.createClassesUsingRecurringClassId = createClassesUsingRecurringClassId;
const getExcludedClasses = (tx, recurringClassIds, date) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const excludedClassData = yield tx.class.findMany({
        where: {
          recurringClassId: { in: recurringClassIds },
          dateTime: { gte: date },
        },
      });
      return excludedClassData;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch classes.");
    }
  });
exports.getExcludedClasses = getExcludedClasses;
// Check if the instructor is already booked at the specified date and time
const isInstructorBooked = (instructorId, dateTime) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const existingBooking = yield prismaClient_1.prisma.class.findFirst({
        where: {
          instructorId,
          dateTime: new Date(dateTime),
          NOT: {
            status: "canceledByCustomer", // if the class status is 'canceledByCustomer, which means the time slot is available (not booked)
          },
        },
      });
      return existingBooking !== null;
    } catch (error) {
      console.error("Error checking instructor booking:", error);
      throw new Error("Failed to check instructor availability.");
    }
  });
exports.isInstructorBooked = isInstructorBooked;
// Check if the selected children have another class with another instructor at the same dateTime
// If there are conflicting classes, return the array of the children's names
const checkForChildrenWithConflictingClasses = (dateTime, childrenIds) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const conflictingClasses = yield prismaClient_1.prisma.class.findMany({
        where: {
          dateTime,
          classAttendance: {
            some: {
              childrenId: {
                in: childrenIds,
              },
            },
          },
        },
        include: {
          classAttendance: {
            include: {
              children: true,
            },
          },
        },
      });
      // Filter out names of the selected children that have conflicts
      const childrenWithConflictingClasses = conflictingClasses.flatMap(
        (eachClass) =>
          eachClass.classAttendance
            .filter((attendance) => childrenIds.includes(attendance.childrenId))
            .map((attendance) => attendance.children.name),
      );
      return childrenWithConflictingClasses;
    } catch (error) {
      console.error("Service Error:", error);
      throw new Error("Failed to check for conflicting classes.");
    }
  });
exports.checkForChildrenWithConflictingClasses =
  checkForChildrenWithConflictingClasses;
// Check if there is a class that is already booked at the same dateTime as the newlly booked class
const checkDoubleBooking = (customerId, dateTime) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const alreadyBookedClass = yield prismaClient_1.prisma.class.findFirst({
        where: {
          customerId,
          dateTime,
          status: "booked",
        },
      });
      // Return true if a booked class is found, otherwise false
      return alreadyBookedClass !== null;
    } catch (error) {
      console.error("Service Error:", error);
      throw new Error("Failed to check class booking.");
    }
  });
exports.checkDoubleBooking = checkDoubleBooking;
