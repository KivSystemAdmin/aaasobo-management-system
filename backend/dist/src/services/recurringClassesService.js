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
exports.getValidRecurringClassesByInstructorId =
  exports.createNewRecurringClass =
  exports.getValidRecurringClasses =
  exports.deleteRecurringClass =
  exports.getRecurringClassByRecurringClassId =
  exports.terminateRecurringClass =
  exports.getRecurringClassesBySubscriptionId =
  exports.addRecurringClass =
    void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
// Create a new recurring class in the DB
const addRecurringClass = (
  tx,
  instructorId,
  customerId,
  childrenIds,
  subscriptionId,
  startAt,
  dateTimes,
  endAt,
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Add the regular class to the RecurringClass table.
      const recurring = yield tx.recurringClass.create({
        data: {
          instructorId,
          subscriptionId,
          startAt,
          endAt,
        },
      });
      // Add the classes to the Class table based on the Recurring Class ID.
      const createdClasses = yield tx.class.createManyAndReturn({
        data: dateTimes.map((dateTime) => ({
          instructorId,
          customerId,
          recurringClassId: recurring.id,
          subscriptionId,
          dateTime,
          status: "booked",
        })),
      });
      // Add the Class Attendance to the ClassAttendance Table based on the Class ID.
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
      // Add the children with recurring class to the RecurringClassAttendance table.
      yield tx.recurringClassAttendance.createMany({
        data: childrenIds.map((childrenId) => ({
          recurringClassId: recurring.id,
          childrenId,
        })),
      });
      return recurring;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to add recurring class.");
    }
  });
exports.addRecurringClass = addRecurringClass;
// Fetch recurring classes by subscription id along with related instructors and customers data
const getRecurringClassesBySubscriptionId = (subscriptionId, date) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const recurringClasses =
        yield prismaClient_1.prisma.recurringClass.findMany({
          where: {
            subscriptionId,
            OR: [{ endAt: { gte: date } }, { endAt: null }],
          },
          include: {
            subscription: {
              include: {
                customer: true,
                plan: true,
              },
            },
            instructor: true,
            recurringClassAttendance: { include: { children: true } },
          },
          orderBy: [{ startAt: "asc" }, { endAt: "asc" }],
        });
      return recurringClasses;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch recurring classes.");
    }
  });
exports.getRecurringClassesBySubscriptionId =
  getRecurringClassesBySubscriptionId;
// Update the end date to the recurring class.
const terminateRecurringClass = (tx, recurringClassId, endAt) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Update the endAt to the RecurringClass table.
      const recurringClass = yield tx.recurringClass.update({
        where: { id: recurringClassId },
        data: {
          endAt,
        },
      });
      // Fetch the classes to be deleted based on recurring class id and startAt.
      const classesToDelete = yield tx.class.findMany({
        where: {
          recurringClassId,
          dateTime: {
            gte: endAt,
          },
        },
        select: { id: true },
      });
      const classIdsToDelete = classesToDelete.map((classObj) => classObj.id);
      // Delete class attendance associated with the class IDs.
      yield tx.classAttendance.deleteMany({
        where: { classId: { in: classIdsToDelete } },
      });
      // Delete the classes themselves.
      yield tx.class.deleteMany({
        where: { id: { in: classIdsToDelete } },
      });
      return recurringClass;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to update the end date to recurring class.");
    }
  });
exports.terminateRecurringClass = terminateRecurringClass;
// Fetch recurring classes by recurring class id
const getRecurringClassByRecurringClassId = (tx, recurringClassId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const recurringClass = yield tx.recurringClass.findFirst({
        where: { id: recurringClassId },
      });
      return recurringClass;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch recurring class.");
    }
  });
exports.getRecurringClassByRecurringClassId =
  getRecurringClassByRecurringClassId;
// Delete the recurring class.
const deleteRecurringClass = (tx, recurringClassId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Fetch the classes to be deleted based on recurring class id.
      const classesToDelete = yield tx.class.findMany({
        where: {
          recurringClassId,
        },
        select: { id: true },
      });
      const classIdsToDelete = classesToDelete.map((classObj) => classObj.id);
      // Delete class attendance associated with the class IDs.
      yield tx.classAttendance.deleteMany({
        where: { classId: { in: classIdsToDelete } },
      });
      // Delete the classes themselves.
      yield tx.class.deleteMany({
        where: { id: { in: classIdsToDelete } },
      });
      // Delete recurring class attendance associated with the recurring id.
      yield tx.recurringClassAttendance.deleteMany({
        where: { recurringClassId },
      });
      // Delete the recurring class itself.
      const recurringClass = yield tx.recurringClass.delete({
        where: { id: recurringClassId },
      });
      return recurringClass;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to delete the recurring class.");
    }
  });
exports.deleteRecurringClass = deleteRecurringClass;
// Fetch recurring classes After endAt or endAt is null
const getValidRecurringClasses = (tx, date) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const recurringClasses = yield tx.recurringClass.findMany({
        where: { OR: [{ endAt: { gte: date } }, { endAt: null }] },
        include: { subscription: true, recurringClassAttendance: true },
      });
      return recurringClasses;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch recurring classes.");
    }
  });
exports.getValidRecurringClasses = getValidRecurringClasses;
// Create new recurring class record
const createNewRecurringClass = (subscriptionId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const newRecurringClass =
        yield prismaClient_1.prisma.recurringClass.create({
          data: {
            instructorId: null,
            subscriptionId: subscriptionId,
            startAt: null,
            endAt: null,
          },
        });
      return newRecurringClass;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to create new recurring class.");
    }
  });
exports.createNewRecurringClass = createNewRecurringClass;
// Fetch recurring classes After endAt or endAt is null by instructor id
const getValidRecurringClassesByInstructorId = (instructorId, date) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const recurringClasses =
        yield prismaClient_1.prisma.recurringClass.findMany({
          where: {
            instructorId,
            OR: [{ endAt: { gte: date } }, { endAt: null }],
          },
        });
      return recurringClasses;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch recurring classes.");
    }
  });
exports.getValidRecurringClassesByInstructorId =
  getValidRecurringClassesByInstructorId;
