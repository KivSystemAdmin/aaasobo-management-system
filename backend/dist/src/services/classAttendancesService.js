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
exports.deleteAttendancesByChildId = void 0;
const deleteAttendancesByChildId = (tx, childId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Delete the Child data.
      const deletedAttendances = yield tx.classAttendance.deleteMany({
        where: { childrenId: childId },
      });
      return deletedAttendances;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to delete class attendances.");
    }
  });
exports.deleteAttendancesByChildId = deleteAttendancesByChildId;
