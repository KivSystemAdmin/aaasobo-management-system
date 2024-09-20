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
exports.getRecurringClassesByInstructorIdController =
  exports.updateRecurringClassesController =
  exports.getRecurringClassesBySubscriptionIdController =
  exports.addRecurringClassController =
    void 0;
const recurringClassesService_1 = require("../services/recurringClassesService");
const dateUtils_1 = require("../helper/dateUtils");
const prismaClient_1 = require("../../prisma/prismaClient");
// POST a recurring class
const addRecurringClassController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
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
  });
exports.addRecurringClassController = addRecurringClassController;
// GET recurring classes by subscription id.
const getRecurringClassesBySubscriptionIdController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const subscriptionId = parseInt(req.query.subscriptionId);
    if (isNaN(subscriptionId)) {
      res.status(400).json({ error: "Invalid subscription ID" });
      return;
    }
    try {
      // Get the local date and the begging of its time.
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const today = date.toISOString().split("T")[0];
      const data = yield (0,
      recurringClassesService_1.getRecurringClassesBySubscriptionId)(
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
        displayEndAt === null || displayEndAt === void 0
          ? void 0
          : displayEndAt.setDate(displayEndAt.getDate() - 1);
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
  });
exports.getRecurringClassesBySubscriptionIdController =
  getRecurringClassesBySubscriptionIdController;
// Update recurring classes
const updateRecurringClassesController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
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
    const jpnToday = new Date(
      today.getTime() + dateUtils_1.JAPAN_TIME_DIFF * 60 * 60 * 1000,
    );
    // if (new Date(classStartDate) <= jpnToday) {
    //   return res.status(400).json({ message: "Invalid Start From Date" });
    // }
    try {
      const updatedRecurringClasses = yield prismaClient_1.prisma.$transaction(
        (tx) =>
          __awaiter(void 0, void 0, void 0, function* () {
            // GET the current recurring class by recurring class id
            const recurringClass = yield (0,
            recurringClassesService_1.getRecurringClassByRecurringClassId)(
              tx,
              req.id,
            );
            if (!recurringClass) {
              throw new Error("Recurring class not found");
            }
            const { endAt, startAt } = recurringClass;
            const firstClassDate = (0, dateUtils_1.calculateFirstDate)(
              new Date(classStartDate),
              day,
              time,
            );
            let dateTimes = [];
            const newStartAt = (0, dateUtils_1.calculateFirstDate)(
              new Date(classStartDate),
              day,
              time,
            );
            let newEndAt = null;
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
            yield (0, recurringClassesService_1.terminateRecurringClass)(
              tx,
              req.id,
              new Date(classStartDate),
            );
            // Delete unnecessary future recurring class.
            const date = new Date(classStartDate);
            const utcClassStartDate = new Date(
              date.getTime() - dateUtils_1.JAPAN_TIME_DIFF * 60 * 60 * 1000,
            );
            if (
              startAt === null ||
              (startAt !== null &&
                new Date(utcClassStartDate) < new Date(startAt))
            ) {
              yield (0, recurringClassesService_1.deleteRecurringClass)(
                tx,
                req.id,
              );
            }
            // Condition2
            if (condition2) {
              // Store the endAt to newEndAt
              newEndAt = endAt;
              // Generate recurring dates until EndAt.
              const until = endAt;
              dateTimes = (0, dateUtils_1.createDatesBetween)(
                firstClassDate,
                until,
              );
            }
            // Condition3
            if (condition3) {
              // Generate recurring dates until the end of the next two months.
              const until = (0, dateUtils_1.getFirstDateInMonths)(
                firstClassDate,
                2,
              );
              dateTimes = (0, dateUtils_1.createDatesBetween)(
                firstClassDate,
                until,
              );
            }
            // Add a new recurring class
            return yield (0, recurringClassesService_1.addRecurringClass)(
              tx,
              instructorId,
              customerId,
              childrenIds,
              subscriptionId,
              newStartAt,
              dateTimes,
              newEndAt !== null && newEndAt !== void 0 ? newEndAt : null,
            );
          }),
      );
      res.status(200).json({
        message: "Regular Class is updated successfully",
        updatedRecurringClasses,
      });
    } catch (error) {
      res.status(500).json({ error: `${error}` });
    }
  });
exports.updateRecurringClassesController = updateRecurringClassesController;
// GET recurring classes by instructor id.
const getRecurringClassesByInstructorIdController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const instructorId = parseInt(req.query.instructorId);
    if (isNaN(instructorId)) {
      res.status(400).json({ error: "Invalid instructor ID" });
      return;
    }
    try {
      // Get the local date and the begging of its time.
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      const today = date.toISOString().split("T")[0];
      const recurringClasses = yield (0,
      recurringClassesService_1.getValidRecurringClassesByInstructorId)(
        instructorId,
        new Date(today + "T00:00:00Z"),
      );
      res.json({ recurringClasses });
    } catch (error) {
      res.status(500).json({ error: `${error}` });
    }
  });
exports.getRecurringClassesByInstructorIdController =
  getRecurringClassesByInstructorIdController;
