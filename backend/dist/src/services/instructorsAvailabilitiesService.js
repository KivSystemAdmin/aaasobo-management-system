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
exports.fetchInstructorAvailabilitiesTodayAndAfter = void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
const fetchInstructorAvailabilitiesTodayAndAfter = (instructorId, startDate) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Get the dateTime to exclude from the `Class` table
      const excludedFromClasses = yield prismaClient_1.prisma.class.findMany({
        where: {
          instructorId: instructorId,
          dateTime: {
            gte: startDate,
          },
          status: {
            in: ["booked", "canceledByInstructor"],
          },
        },
        select: {
          dateTime: true,
        },
      });
      // Get the dateTime to exclude from the `instructorUnavailability` table
      const excludedFromUnavailability =
        yield prismaClient_1.prisma.instructorUnavailability.findMany({
          where: {
            instructorId: instructorId,
            dateTime: {
              gte: startDate,
            },
          },
          select: {
            dateTime: true,
          },
        });
      // Combine the excluded dateTime
      const excludedDateTimes = [
        ...excludedFromClasses.map((record) => record.dateTime),
        ...excludedFromUnavailability.map((record) => record.dateTime),
      ];
      // Get the availabilities from the `instructorAvailability` table
      const availabilities =
        yield prismaClient_1.prisma.instructorAvailability.findMany({
          where: {
            instructorId: instructorId,
            dateTime: {
              gte: startDate,
              notIn: excludedDateTimes, // Exclude the dateTime from the list
            },
          },
          orderBy: {
            dateTime: "asc",
          },
        });
      // Convert to an array of dateTime only
      const dateTimes = availabilities.map(
        (availability) => availability.dateTime,
      );
      return dateTimes;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch instructor availabilities.");
    }
  });
exports.fetchInstructorAvailabilitiesTodayAndAfter =
  fetchInstructorAvailabilitiesTodayAndAfter;
