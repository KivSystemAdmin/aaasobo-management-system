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
exports.getChildByIdController =
  exports.deleteChildController =
  exports.updateChildController =
  exports.registerChildController =
  exports.getChildrenController =
    void 0;
const childrenService_1 = require("../services/childrenService");
const classAttendancesService_1 = require("../services/classAttendancesService");
const classesService_1 = require("../services/classesService");
const prismaClient_1 = require("../../prisma/prismaClient");
const getChildrenController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const customerId = req.query.customerId;
    if (!customerId) {
      return res.status(400).json({ error: "customerId is required" });
    }
    try {
      const children = yield (0, childrenService_1.getChildren)(customerId);
      res.json({ children });
    } catch (error) {
      res.status(500).json({ error: `${error}` });
    }
  });
exports.getChildrenController = getChildrenController;
const registerChildController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { name, birthdate, personalInfo, customerId } = req.body;
    try {
      const child = yield (0, childrenService_1.registerChild)(
        name,
        birthdate,
        personalInfo,
        customerId,
      );
      res.status(200).json({
        message: "Child is registered successfully",
        child,
      });
    } catch (error) {
      res.status(500).json({ error: `${error}` });
    }
  });
exports.registerChildController = registerChildController;
const updateChildController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const childId = parseInt(req.params.id);
    const { name, birthdate, personalInfo, customerId } = req.body;
    try {
      const child = yield (0, childrenService_1.updateChild)(
        childId,
        name,
        birthdate,
        personalInfo,
        customerId,
      );
      res.status(200).json({
        message: "Child is updated successfully",
        child,
      });
    } catch (error) {
      res.status(500).json({ error: `${error}` });
    }
  });
exports.updateChildController = updateChildController;
// DELETE a child profile by the child's id
var ErrorMessages;
(function (ErrorMessages) {
  ErrorMessages["completedClass"] =
    "Cannot delete this child's profile because the child has attended a class before.";
  ErrorMessages["bookedClass"] =
    "Cannot delete this child's profile because the child is currently enrolled in booked classes.";
})(ErrorMessages || (ErrorMessages = {}));
const deleteChildController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const childId = parseInt(req.params.id);
    if (isNaN(childId)) {
      return res.status(400).json({ error: "Invalid child ID." });
    }
    try {
      const result = yield prismaClient_1.prisma.$transaction((tx) =>
        __awaiter(void 0, void 0, void 0, function* () {
          const hasCompletedClass = yield (0,
          classesService_1.checkIfChildHasCompletedClass)(tx, childId);
          if (hasCompletedClass) {
            throw new Error(ErrorMessages.completedClass);
          }
          const hasBookedClass = yield (0,
          classesService_1.checkIfChildHasBookedClass)(tx, childId);
          if (hasBookedClass) {
            throw new Error(ErrorMessages.bookedClass);
          }
          yield (0, classAttendancesService_1.deleteAttendancesByChildId)(
            tx,
            childId,
          );
          const deletedChild = yield (0, childrenService_1.deleteChild)(
            tx,
            childId,
          );
          return deletedChild;
        }),
      );
      res.status(200).json({
        message: "The child profile was deleted successfully",
        deletedChild: result,
      });
    } catch (error) {
      console.error("Failed to delete the child profile:", error);
      if (
        error instanceof Error &&
        Object.values(ErrorMessages).includes(error.message)
      ) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete the child profile." });
    }
  });
exports.deleteChildController = deleteChildController;
const getChildByIdController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
      const child = yield (0, childrenService_1.getChildById)(id);
      res.json(child);
    } catch (error) {
      console.error("Controller Error:", error);
      res.status(500).json({ error: "Failed to fetch child data." });
    }
  });
exports.getChildByIdController = getChildByIdController;
