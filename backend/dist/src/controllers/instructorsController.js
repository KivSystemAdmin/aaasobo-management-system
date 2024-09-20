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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutInstructorController =
  exports.loginInstructorController =
  exports.getRecurringAvailabilityById =
  exports.getAllInstructorsController =
  exports.getInstructorAvailabilities =
  exports.deleteAvailability =
  exports.addAvailability =
  exports.RecurringAvailability =
  exports.getInstructor =
  exports.getAllInstructorsAvailabilitiesController =
    void 0;
const prismaClient_1 = require("../../prisma/prismaClient");
const commonUtils_1 = require("../helper/commonUtils");
const dateUtils_1 = require("../helper/dateUtils");
const instructorsService_1 = require("../services/instructorsService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const logout_1 = require("../helper/logout");
// Fetch all the instructors and their availabilities
const getAllInstructorsAvailabilitiesController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { day, time, from } = req.query;
    if (day && time && from) {
      const instructors = yield searchInstructorsUsingRecurringAvailability(
        day,
        time,
        from,
      );
      return res.status(200).json({ instructors });
    }
    try {
      // Fetch the instructors and their availabilities data from the DB
      const instructors = yield (0,
      instructorsService_1.getAllInstructorsAvailabilities)();
      // Define the properties to pick.
      const selectedProperties = [
        "id",
        "name",
        "instructorAvailability",
        "instructorUnavailability",
      ];
      // Define the property name mapping.
      const propertyMapping = {
        instructorAvailability: "availabilities",
        instructorUnavailability: "unavailabilities",
      };
      // Transform the data structure.
      const data = instructors.map((instructor) =>
        (0, commonUtils_1.pickProperties)(
          instructor,
          selectedProperties,
          propertyMapping,
        ),
      );
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.getAllInstructorsAvailabilitiesController =
  getAllInstructorsAvailabilitiesController;
// Return instructors who are available on the specific day and time after the `from` date.
// This function is expected to be used to find instructors for a regular class,
// so availability that is supposed to end is not included.
// Example:
// Elian has a recurring availability with `startAt` = 2024-07-02T08:00:00.000Z = Tue 17:00.
// With parameters day = "Tue", time = "17:00", and from = "2024-07-01", Elian should be included.
function searchInstructorsUsingRecurringAvailability(day, time, from) {
  return __awaiter(this, void 0, void 0, function* () {
    const firstDate = (0, dateUtils_1.calculateFirstDate)(
      new Date(from),
      day,
      time,
    );
    const nextDay = new Date(firstDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    nextDay.setUTCHours(0, 0, 0);
    const [hour, minute] = time.split(":").map(Number);
    // queryRaw is used to use EXTRACT function.
    const instructors = yield prismaClient_1.prisma.$queryRaw`
      SELECT
        "Instructor".*
      FROM
        "InstructorRecurringAvailability"
        INNER JOIN "Instructor"
          ON "Instructor".id = "InstructorRecurringAvailability"."instructorId"
      WHERE
        to_char("startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'Dy') = ${day}
        AND EXTRACT(HOUR FROM "startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') = ${hour}
        AND EXTRACT(MINUTE FROM "startAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') = ${minute}
        AND ("startAt" < ${nextDay} AND "endAt" IS NULL)
    `;
    return instructors;
  });
}
function setErrorResponse(res, error) {
  return res
    .status(500)
    .json({ message: error instanceof Error ? error.message : `${error}` });
}
const getInstructor = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID provided." });
    }
    try {
      const instructor = yield (0, instructorsService_1.getInstructorById)(id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found." });
      }
      return res.status(200).json({
        instructor: {
          id: instructor.id,
          name: instructor.name,
          availabilities: instructor.instructorAvailability,
          unavailabilities: instructor.instructorUnavailability,
          nickname: instructor.nickname,
          email: instructor.email,
          icon: instructor.icon,
          classURL: instructor.classURL,
          meetingId: instructor.meetingId,
          passcode: instructor.passcode,
          introductionURL: instructor.introductionURL,
        },
      });
    } catch (error) {
      return setErrorResponse(res, error);
    }
  });
exports.getInstructor = getInstructor;
var RecurringAvailability;
(function (RecurringAvailability) {
  // Returns the recurring availability that is valid on a specific date.
  RecurringAvailability.get = (req, res) =>
    __awaiter(this, void 0, void 0, function* () {
      if (!req.query.date) {
        return res.status(400).json({ message: "Invalid date provided." });
      }
      // Include recurring availability starting on `date`.
      // e.g., req.query.date = 2024-07-24 => date: 2024-07-24 23:59:59
      const date = new Date(req.query.date);
      date.setUTCDate(date.getUTCDate() + 1);
      date.setSeconds(-1);
      const instructor = yield callServiceWithoutException(() =>
        (0, instructorsService_1.getInstructorWithRecurringAvailability)(
          req.id,
        ),
      );
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found." });
      }
      if ("message" in instructor) {
        return res.status(500).json({ message: instructor.message });
      }
      const availabilitiesOfDay = instructor.instructorRecurringAvailability
        .filter(({ startAt, endAt }) => {
          const notStarted = date < startAt;
          const alreadyEnded = endAt && endAt <= date;
          return !notStarted && !alreadyEnded;
        })
        .map(({ startAt }) => {
          const [hour, minute] = [
            startAt.getUTCHours() + dateUtils_1.JAPAN_TIME_DIFF,
            startAt.getUTCMinutes(),
          ];
          return { day: getDayName(startAt), time: formatTime(hour, minute) };
        });
      return res.status(200).json({
        id: instructor.id,
        name: instructor.name,
        recurringAvailabilities: groupByDay(availabilitiesOfDay),
      });
    });
  RecurringAvailability.put = (req, res) =>
    __awaiter(this, void 0, void 0, function* () {
      const { slotsOfDays, startDate: startDateStr } = req.body;
      const startDate = new Date(startDateStr);
      const newEndAt = startDate;
      // Use Promise.all to avoid the error "Transaction already closed: Could not perform operation.".
      const tasks = [];
      yield prismaClient_1.prisma.$transaction((tx) =>
        __awaiter(this, void 0, void 0, function* () {
          const recurrings = yield (0,
          instructorsService_1.getInstructorWithRecurringAvailabilityDay)(
            req.id,
            tx,
          );
          for (const { id, startAt, endAt, day, time } of recurrings) {
            const isIncludedInNewSchedule = slotsOfDays[day].some(
              (slot) => slot === time,
            );
            if (!isIncludedInNewSchedule) {
              const end = maxDate(startAt, newEndAt);
              tasks.push(
                (0, instructorsService_1.terminateRecurringAvailability)(
                  req.id,
                  id,
                  end,
                  tx,
                ),
              );
              continue;
            }
            const newStartAt = (0, dateUtils_1.calculateFirstDate)(
              startDate,
              day,
              time,
            );
            if (endAt && endAt < newStartAt) {
              // startAt  endAt  newStartAt
              // |---------|      |----------
              tasks.push(
                (0, instructorsService_1.addInstructorRecurringAvailability)(
                  req.id,
                  newStartAt,
                  tx,
                ),
              );
            }
            // newStartAt  startAt  (endAt)
            //   |---------------------
            // startAt  newStartAt  (endAt)
            //   |---------------------
            const start = minDate(startAt, newStartAt);
            tasks.push(
              (0, instructorsService_1.updateRecurringAvailabilityInterval)(
                id,
                start,
                null,
                tx,
              ),
            );
          }
          // Create new recurring availabilities.
          dateUtils_1.days.forEach((day) => {
            slotsOfDays[day]
              .filter((time) => {
                // Exclude data already processed above.
                const existsInDb = recurrings.some(
                  (a) => a.day === day && a.time === time,
                );
                return !existsInDb;
              })
              .forEach((time) =>
                __awaiter(this, void 0, void 0, function* () {
                  const startAt = (0, dateUtils_1.calculateFirstDate)(
                    startDate,
                    day,
                    time,
                  );
                  tasks.push(
                    (0,
                    instructorsService_1.addInstructorRecurringAvailability)(
                      req.id,
                      startAt,
                      tx,
                    ),
                  );
                }),
              );
          });
          yield Promise.all(tasks);
          const until = new Date();
          until.setUTCMonth(until.getMonth() + 3);
          until.setUTCDate(1);
          until.setUTCHours(0, 0, 0, 0);
          yield addAvailabilityInternal(tx, req.id, startDate, until);
        }),
      );
      res.status(200).end();
    });
  const getDayName = (date) => {
    return dateUtils_1.days[date.getUTCDay()];
  };
  const minDate = (a, b) => {
    return a < b ? a : b;
  };
  const maxDate = (a, b) => {
    return a > b ? a : b;
  };
  // Format the time to "HH:MM".
  const formatTime = (hour, minute) => {
    const h = hour.toString().padStart(2, "0");
    const m = minute.toString().padStart(2, "0");
    return `${h}:${m}`;
  };
  function groupByDay(dayTimes) {
    const res = {
      Sun: [],
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
    };
    for (const { day, time } of dayTimes) {
      res[day].push(time);
    }
    return res;
  }
  function callServiceWithoutException(func) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        return yield func();
      } catch (error) {
        return { message: error instanceof Error ? error.message : `${error}` };
      }
    });
  }
})(
  RecurringAvailability ||
    (exports.RecurringAvailability = RecurringAvailability = {}),
);
const addAvailability = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { from: fromStr, until: untilStr } = req.body;
    if (!fromStr || !untilStr) {
      return res.status(400).json({ message: "Invalid parameters provided." });
    }
    const until = new Date(untilStr);
    until.setUTCDate(until.getUTCDate() + 1); // include until date
    const from = new Date(fromStr);
    if (until < from) {
      return res.status(400).json({ message: "Invalid range provided." });
    }
    yield prismaClient_1.prisma.$transaction((tx) =>
      __awaiter(void 0, void 0, void 0, function* () {
        yield addAvailabilityInternal(tx, req.id, from, until);
      }),
    );
    return res.status(200).json({});
  });
exports.addAvailability = addAvailability;
function addAvailabilityInternal(tx, instructorId, from, until) {
  return __awaiter(this, void 0, void 0, function* () {
    const recurringAvailabilities = yield (0,
    instructorsService_1.getInstructorRecurringAvailabilities)(
      tx,
      instructorId,
    );
    // const unavailabilities = await getInstructorUnavailabilities(tx, instructorId);
    // Get overlapping dates of [startAt, endAt) and [from, until).
    const dateTimes = recurringAvailabilities.map(
      ({ id, startAt: startAtStr, endAt: endAtStr }) => {
        const startAt = new Date(startAtStr);
        const endAt = endAtStr ? new Date(endAtStr) : null;
        // from  until  startAt  endAt
        // || (empty)
        if (until <= startAt) {
          return { instructorRecurringAvailabilityId: id, dateTimes: [] };
        }
        // startAt  endAt  from  until
        // || (empty)
        if (endAt && endAt <= from) {
          return { instructorRecurringAvailabilityId: id, dateTimes: [] };
        }
        const start = startAt;
        while (startAt < from) {
          startAt.setUTCDate(startAt.getUTCDate() + 7);
        }
        if (!endAt) {
          // start  until
          //   |------|
          return {
            instructorRecurringAvailabilityId: id,
            dateTimes: (0, dateUtils_1.createDatesBetween)(start, until),
          };
        }
        const end = until < endAt ? until : endAt;
        // start  end
        //   |-----|
        return {
          instructorRecurringAvailabilityId: id,
          dateTimes: (0, dateUtils_1.createDatesBetween)(start, end),
        };
      },
    );
    const unavailabilities = (yield (0,
    instructorsService_1.getUnavailabilities)(instructorId)).map(
      ({ dateTime }) => dateTime,
    );
    dateTimes.forEach((dateTimes) => {
      dateTimes.dateTimes = dateTimes.dateTimes.filter(
        (dateTime) => !unavailabilities.includes(dateTime),
      );
    });
    yield (0, instructorsService_1.addInstructorAvailabilities)(
      tx,
      instructorId,
      dateTimes,
    );
  });
}
const deleteAvailability = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { dateTime } = req.body;
    if (!dateTime) {
      return res.status(400).json({ message: "Invalid dateTime provided." });
    }
    const availability = yield (0,
    instructorsService_1.deleteInstructorAvailability)(req.id, dateTime);
    return res.status(200).json({ availability });
  });
exports.deleteAvailability = deleteAvailability;
const getInstructorAvailabilities = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const instructorAvailabilities = yield (0,
      instructorsService_1.fetchInstructorAvailabilities)(req.id);
      if (!instructorAvailabilities) {
        return res
          .status(404)
          .json({ message: "Instructor availabilities not found." });
      }
      return res.status(200).json({
        instructorAvailabilities,
      });
    } catch (error) {
      return setErrorResponse(res, error);
    }
  });
exports.getInstructorAvailabilities = getInstructorAvailabilities;
const getAllInstructorsController = (_, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const instructors = yield (0, instructorsService_1.getAllInstructors)();
      if (!instructors) {
        return res.status(404).json({ message: "Instructors not found." });
      }
      return res.status(200).json({ instructors });
    } catch (error) {
      return setErrorResponse(res, error);
    }
  });
exports.getAllInstructorsController = getAllInstructorsController;
// GET recurring availability by instructor id.
const getRecurringAvailabilityById = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    // Get the local date and the end of its time.
    const today = new Date();
    today.setUTCHours(23, 59, 59, 0);
    today.setDate(today.getDate());
    try {
      const recurringAvailabilities = yield (0,
      instructorsService_1.getValidRecurringAvailabilities)(req.id, today);
      res.json({ recurringAvailabilities });
    } catch (error) {
      res.status(500).json({ error: `${error}` });
    }
  });
exports.getRecurringAvailabilityById = getRecurringAvailabilityById;
// Login Instructor
const loginInstructorController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    try {
      // Fetch the instructor by the email.
      const instructor = yield (0, instructorsService_1.getInstructorByEmail)(
        email,
      );
      if (!instructor) {
        return res.status(401).json({
          message: "Instructor not found.",
        });
      }
      // Check if the password is correct or not.
      const result = yield bcrypt_1.default.compare(
        password,
        instructor.password,
      );
      if (!result) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }
      // Set the session.
      req.session = {
        userId: instructor.id,
        userType: "instructor",
      };
      res.status(200).json({
        instructorId: instructor.id,
        message: "Instructor logged in successfully",
      });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
exports.loginInstructorController = loginInstructorController;
const logoutInstructorController = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    return (0, logout_1.logout)(req, res, "instructor");
  });
exports.logoutInstructorController = logoutInstructorController;
