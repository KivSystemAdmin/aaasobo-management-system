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
exports.createInstructorUnavailability = exports.getInstructorUnavailabilities =
  void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
function getInstructorUnavailabilities(instructorId) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.instructorUnavailability.findMany({
        where: { instructorId },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch instructor unavailabilities.");
    }
  });
}
exports.getInstructorUnavailabilities = getInstructorUnavailabilities;
function createInstructorUnavailability(instructorId, dateTime) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      yield prismaClient_1.prisma.instructorUnavailability.create({
        data: { instructorId, dateTime },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to create instructor unavailability.");
    }
  });
}
exports.createInstructorUnavailability = createInstructorUnavailability;
