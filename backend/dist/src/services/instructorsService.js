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
exports.getUnavailabilities =
  exports.updateRecurringAvailabilityInterval =
  exports.terminateRecurringAvailability =
  exports.getInstructorWithRecurringAvailabilityDay =
  exports.getInstructorByEmail =
  exports.getValidRecurringAvailabilities =
  exports.fetchInstructorAvailabilities =
  exports.deleteInstructorAvailability =
  exports.addInstructorAvailabilities =
  exports.getInstructorRecurringAvailabilities =
  exports.getInstructorWithRecurringAvailability =
  exports.addInstructorRecurringAvailability =
  exports.getInstructorById =
  exports.getAllInstructorsAvailabilities =
  exports.getAllInstructors =
  exports.createInstructor =
    void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
const client_1 = require("@prisma/client");
// Create a new instructor account in the DB
const createInstructor = (instructorData) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.instructor.create({
        data: instructorData,
      });
    } catch (error) {
      if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // P2002: Unique Constraint Violation
        if (error.code === "P2002") {
          throw new Error("Email is already registered");
        } else {
          console.error("Database Error:", error);
          throw new Error("Failed to register instructor");
        }
      } else {
        throw error;
      }
    }
  });
exports.createInstructor = createInstructor;
// Fetch all instructors information
const getAllInstructors = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.instructor.findMany();
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch instructors.");
    }
  });
exports.getAllInstructors = getAllInstructors;
// Fetch all the availabilities of the instructors
const getAllInstructorsAvailabilities = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.instructor.findMany({
        include: {
          instructorAvailability: true,
          instructorUnavailability: true,
        },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch instructors' availabilities.");
    }
  });
exports.getAllInstructorsAvailabilities = getAllInstructorsAvailabilities;
function getInstructorById(id) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      return prismaClient_1.prisma.instructor.findUnique({
        where: { id },
        include: {
          instructorAvailability: true,
          instructorUnavailability: true,
        },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch instructor.");
    }
  });
}
exports.getInstructorById = getInstructorById;
function addInstructorRecurringAvailability(instructorId_1, startAt_1) {
  return __awaiter(
    this,
    arguments,
    void 0,
    function* (instructorId, startAt, tx = prismaClient_1.prisma) {
      try {
        yield tx.instructorRecurringAvailability.create({
          data: {
            instructorId,
            startAt,
          },
        });
      } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to add instructor recurring availability.");
      }
    },
  );
}
exports.addInstructorRecurringAvailability = addInstructorRecurringAvailability;
function getInstructorWithRecurringAvailability(instructorId) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.instructor.findUnique({
        where: { id: instructorId },
        include: { instructorRecurringAvailability: true },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error(
        "Failed to fetch instructor with recurring availability.",
      );
    }
  });
}
exports.getInstructorWithRecurringAvailability =
  getInstructorWithRecurringAvailability;
function getInstructorRecurringAvailabilities(tx, instructorId) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      return tx.instructorRecurringAvailability.findMany({
        where: { instructorId },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch recurring availabilities.");
    }
  });
}
exports.getInstructorRecurringAvailabilities =
  getInstructorRecurringAvailabilities;
function addInstructorAvailabilities(
  tx,
  instructorId,
  recurringAvailabilities,
) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      const unavailabilities = yield tx.instructorUnavailability.findMany({
        where: { instructorId },
      });
      const excludeDateTimes = new Set(
        unavailabilities.map(({ dateTime }) => dateTime.toISOString()),
      );
      for (const recurringAvailability of recurringAvailabilities) {
        const { instructorRecurringAvailabilityId, dateTimes } =
          recurringAvailability;
        for (const dateTime of dateTimes) {
          if (excludeDateTimes.has(dateTime.toISOString())) {
            continue;
          }
          const data = {
            instructorId,
            instructorRecurringAvailabilityId,
            dateTime,
          };
          yield tx.instructorAvailability.upsert({
            where: { instructorId_dateTime: { instructorId, dateTime } },
            update: data,
            create: data,
          });
        }
      }
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to add instructor availabilities.");
    }
  });
}
exports.addInstructorAvailabilities = addInstructorAvailabilities;
function deleteInstructorAvailability(instructorId, dateTime) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      return prismaClient_1.prisma.instructorAvailability.delete({
        where: { instructorId_dateTime: { instructorId, dateTime } },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to delete instructor availability.");
    }
  });
}
exports.deleteInstructorAvailability = deleteInstructorAvailability;
function fetchInstructorAvailabilities(instructorId) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      const availabilities =
        yield prismaClient_1.prisma.instructorAvailability.findMany({
          where: {
            instructorId,
          },
          select: {
            dateTime: true,
          },
        });
      const availableDateTimes = availabilities.map(
        (availability) => availability.dateTime,
      );
      return availableDateTimes;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to get instructor availabilities.");
    }
  });
}
exports.fetchInstructorAvailabilities = fetchInstructorAvailabilities;
// Fetch recurring availability After endAt or endAt is null
const getValidRecurringAvailabilities = (instructorId, date) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const recurringAvailabilities =
        yield prismaClient_1.prisma.instructorRecurringAvailability.findMany({
          where: {
            instructorId,
            OR: [{ endAt: { gt: date } }, { endAt: null }],
          },
        });
      return recurringAvailabilities;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch instructor's recurring availability.");
    }
  });
exports.getValidRecurringAvailabilities = getValidRecurringAvailabilities;
// Fetch the instructor by the email
const getInstructorByEmail = (email) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      return yield prismaClient_1.prisma.instructor.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch instructor.");
    }
  });
exports.getInstructorByEmail = getInstructorByEmail;
function getInstructorWithRecurringAvailabilityDay(instructorId, tx) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      // Prisma doesnt' suppport EXTRACT function, so $queryRaw is used.
      return yield tx.$queryRaw`
        SELECT
          *,
          to_char("startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'Dy') AS day,
          LPAD(EXTRACT(HOUR FROM "startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::TEXT, 2, '0')
            || ':'
            || LPAD(EXTRACT(MINUTE FROM "startAt")::TEXT, 2, '0') as time
        FROM
          "InstructorRecurringAvailability"
        WHERE "instructorId" = ${instructorId}
      `;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch recurring availabilities.");
    }
  });
}
exports.getInstructorWithRecurringAvailabilityDay =
  getInstructorWithRecurringAvailabilityDay;
function terminateRecurringAvailability(
  instructorId,
  instructorRecurringAvailabilityId,
  endAt,
  tx,
) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      const availabilitiesToDelete = yield tx.instructorAvailability.findMany({
        where: {
          instructorRecurringAvailabilityId,
          dateTime: { gte: endAt },
        },
      });
      const associatedClass = yield tx.class.findFirst({
        where: {
          instructorId,
          dateTime: { in: availabilitiesToDelete.map((slot) => slot.dateTime) },
        },
      });
      if (associatedClass) {
        // TODO: Consider how to handle conflicts.
        // e.g., set the status of the class to "canceledByInstructor".
        throw Error(
          "Cannot delete a recurring availability with associated class.",
        );
      }
      yield tx.instructorAvailability.deleteMany({
        where: {
          instructorRecurringAvailabilityId,
          dateTime: { gte: endAt },
        },
      });
      yield tx.instructorRecurringAvailability.update({
        where: { id: instructorRecurringAvailabilityId },
        data: { endAt },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to terminate recurring availability.");
    }
  });
}
exports.terminateRecurringAvailability = terminateRecurringAvailability;
function updateRecurringAvailabilityInterval(
  instructorRecurringAvailabilityId,
  startAt,
  endAt,
  tx,
) {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      yield tx.instructorRecurringAvailability.update({
        where: { id: instructorRecurringAvailabilityId },
        data: { startAt, endAt },
      });
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error(
        "Failed to update instructor recurring availability interval.",
      );
    }
  });
}
exports.updateRecurringAvailabilityInterval =
  updateRecurringAvailabilityInterval;
function getUnavailabilities(instructorId) {
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
exports.getUnavailabilities = getUnavailabilities;
