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
require("dotenv/config");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function insertInstructors() {
  return __awaiter(this, void 0, void 0, function* () {
    yield prisma.instructor.create({
      data: {
        email: "helen@example.com",
        name: "Helene Gay Santos",
        nickname: "Helen",
        icon: "helen-1.jpg",
        classURL: "https://zoom.us/j/12345?pwd=ABCde",
        meetingId: "123 456 7890",
        passcode: "helen",
        password:
          "$2b$12$lzg9z2HDTl/dwd8DSnGHJOdPIYiFvn40fwEzRtimoty5VtOugaTfa", // password: helen
        introductionURL:
          "https://select-type.com/rsv/?id=9krPgyM7znE&c_id=129259",
      },
    });
    // await prisma.instructor.create({
    //   data: {
    //     email: "elian@example.com",
    //     name: "Elian P.Quilisadio",
    //     nickname: "Elian",
    //     icon: "elian-1.jpg",
    //     classURL: "https://zoom.us/j/67890?pwd=FGHij",
    //     meetingId: "234 567 8901",
    //     passcode: "elian",
    //     password: "$2b$12$Oe8qdMedbkuqhY31pgkH7OaMukvbUawE63inMCoDSeY5CHRS3Gc.u", // password: elian
    //     introductionURL:
    //       "https://select-type.com/rsv/?id=9krPgyM7znE&c_id=127929",
    //   },
    // });
  });
}
function insertInstructorAvailabilities() {
  return __awaiter(this, void 0, void 0, function* () {
    const helen = yield getInstructor("Helen");
    // const elian = await getInstructor("Elian");
    yield prisma.instructorRecurringAvailability.createMany({
      data: [
        { startAt: "2024-08-05T07:00:00Z", instructorId: helen.id }, // 16:00 in Japan
        { startAt: "2024-08-06T07:00:00Z", instructorId: helen.id }, // 16:00 in Japan
        // { startAt: "2024-07-01T07:30:00Z", instructorId: helen.id }, // 16:30 in Japan
        // { startAt: "2024-07-01T08:00:00Z", instructorId: elian.id }, // 17:00 in Japan
        // { startAt: "2024-07-02T08:00:00Z", instructorId: elian.id }, // 17:00 in Japan
        // {
        //   startAt: "2024-07-02T08:30:00Z",
        //   instructorId: elian.id,
        //   endAt: "2024-07-24T00:00:00Z",
        // }, // 17:30 in Japan
      ],
    });
    const insertAvailabilities = (instructorId, startAt, dateTimes) =>
      __awaiter(this, void 0, void 0, function* () {
        const r = yield prisma.instructorRecurringAvailability.findFirst({
          where: { instructorId, startAt },
        });
        if (!r) {
          throw new Error("Recurring availability not found");
        }
        yield prisma.instructorAvailability.createMany({
          data: dateTimes.map((dateTime) => ({
            dateTime,
            instructorId,
            instructorRecurringAvailabilityId: r.id,
          })),
        });
      });
    yield insertAvailabilities(helen.id, "2024-08-05T07:00:00Z", [
      "2024-08-05T07:00:00Z",
      "2024-08-12T07:00:00Z",
      "2024-08-19T07:00:00Z",
      "2024-08-26T07:00:00Z",
      // "2024-07-29T07:00:00Z",
    ]);
    yield insertAvailabilities(helen.id, "2024-08-06T07:00:00Z", [
      "2024-08-06T07:00:00Z",
      "2024-08-13T07:00:00Z",
      "2024-08-20T07:00:00Z",
      "2024-08-27T07:00:00Z",
    ]);
    // await insertAvailabilities(helen.id, "2024-07-01T07:30:00Z", [
    //   "2024-07-01T07:30:00Z",
    //   "2024-07-08T07:30:00Z",
    //   "2024-07-15T07:30:00Z",
    //   "2024-07-22T07:30:00Z",
    //   "2024-07-27T07:30:00Z",
    //   "2024-07-29T07:30:00Z",
    //   "2024-07-30T07:30:00Z",
    //   "2024-07-31T07:30:00Z",
    //   "2024-08-01T07:30:00Z",
    //   "2024-08-02T07:30:00Z",
    //   "2024-08-03T07:30:00Z",
    //   "2024-08-04T07:30:00Z",
    //   "2024-08-05T07:30:00Z",
    //   "2024-08-06T07:30:00Z",
    //   "2024-08-07T07:30:00Z",
    //   "2024-08-08T07:30:00Z",
    //   "2024-08-09T07:30:00Z",
    //   "2024-08-10T07:30:00Z",
    //   "2024-08-12T07:30:00Z",
    //   "2024-08-13T07:30:00Z",
    //   "2024-08-14T07:30:00Z",
    //   "2024-08-15T07:30:00Z",
    //   "2024-08-16T07:30:00Z",
    //   "2024-08-17T07:30:00Z",
    //   "2024-08-19T07:30:00Z",
    //   "2024-08-20T07:30:00Z",
    //   "2024-08-21T07:30:00Z",
    //   "2024-08-22T07:30:00Z",
    //   "2024-08-23T07:30:00Z",
    // ]);
    // await insertAvailabilities(elian.id, "2024-07-01T08:00:00Z", [
    //   "2024-07-01T08:00:00Z",
    //   "2024-07-08T08:00:00Z",
    //   "2024-07-15T08:00:00Z",
    //   "2024-07-22T08:00:00Z",
    //   "2024-07-29T08:00:00Z",
    //   "2024-08-03T07:30:00Z",
    //   "2024-08-04T07:30:00Z",
    //   "2024-08-05T07:30:00Z",
    //   "2024-08-06T07:30:00Z",
    // ]);
    // await insertAvailabilities(elian.id, "2024-07-02T08:00:00Z", [
    //   "2024-07-02T08:00:00Z",
    //   "2024-07-09T08:00:00Z",
    //   "2024-07-16T08:00:00Z",
    //   "2024-07-23T08:00:00Z",
    //   "2024-07-30T08:00:00Z",
    // ]);
    // await insertAvailabilities(elian.id, "2024-07-02T08:30:00Z", [
    //   "2024-07-02T08:30:00Z",
    //   "2024-07-09T08:30:00Z",
    //   "2024-07-16T08:30:00Z",
    //   "2024-07-23T08:30:00Z",
    //   "2024-08-10T07:30:00Z",
    //   "2024-08-12T07:30:00Z",
    //   "2024-08-13T07:30:00Z",
    //   "2024-08-14T07:30:00Z",
    //   "2024-08-15T07:30:00Z",
    //   "2024-08-16T07:30:00Z",
    //   "2024-08-17T07:30:00Z",
    //   "2024-08-19T07:30:00Z",
    //   "2024-08-20T07:30:00Z",
    //   "2024-08-21T07:30:00Z",
    //   "2024-08-22T07:30:00Z",
    //   "2024-08-23T07:30:00Z",
    // ]);
  });
}
function insertCustomers() {
  return __awaiter(this, void 0, void 0, function* () {
    yield prisma.customer.createMany({
      data: [
        {
          name: "Alice",
          email: "alice@example.com",
          password: "alice",
          prefecture: "Aomori",
        },
        // {
        //   name: "Bob",
        //   email: "bob@example.com",
        //   password: "bob",
        //   prefecture: "Hokkaido",
        // },
      ],
    });
  });
}
function insertAdmins() {
  return __awaiter(this, void 0, void 0, function* () {
    yield prisma.admins.createMany({
      data: [
        {
          name: "Admin",
          email: "admin@example.com",
          password:
            "$2b$12$QdrIpwz5heeLTgrJOfHr0ejPtoj9.CBiOZiZh7YjvZh9R0xgytX.e", // password: admin
        },
        {
          name: "aaa",
          email: "aaa@aaa.com",
          password:
            "$2b$12$99tn47qTel2SzphZnyvWsutiFGk35qQWTd8rB8KQjPRHEn.h63Gf.", // password: aaa
        },
      ],
    });
  });
}
function insertClasses() {
  return __awaiter(this, void 0, void 0, function* () {
    const alice = yield getCustomer("Alice");
    // const bob = await getCustomer("Bob");
    const helen = yield getInstructor("Helen");
    // const elian = await getInstructor("Elian");
    yield prisma.class.createMany({
      data: [
        {
          instructorId: helen.id,
          customerId: alice.id,
          dateTime: "2024-08-05T07:00:00Z",
          status: "completed",
          isRebookable: true,
          subscriptionId: alice.subscription[0].id,
          recurringClassId: 1,
        },
        {
          instructorId: helen.id,
          customerId: alice.id,
          dateTime: "2024-08-12T07:00:00Z",
          status: "booked",
          isRebookable: false,
          subscriptionId: alice.subscription[0].id,
          recurringClassId: 1,
        },
        {
          instructorId: helen.id,
          customerId: alice.id,
          dateTime: "2024-08-19T07:00:00Z",
          status: "booked",
          isRebookable: false,
          subscriptionId: alice.subscription[0].id,
          recurringClassId: 1,
        },
        {
          instructorId: helen.id,
          customerId: alice.id,
          dateTime: "2024-08-26T07:00:00Z",
          status: "booked",
          subscriptionId: alice.subscription[0].id,
          recurringClassId: 1,
        },
        {
          instructorId: helen.id,
          customerId: alice.id,
          dateTime: "2024-08-06T07:00:00Z",
          status: "completed",
          isRebookable: true,
          subscriptionId: alice.subscription[0].id,
          recurringClassId: 1,
        },
        {
          instructorId: helen.id,
          customerId: alice.id,
          dateTime: "2024-08-13T07:00:00Z",
          status: "booked",
          isRebookable: false,
          subscriptionId: alice.subscription[0].id,
          recurringClassId: 1,
        },
        {
          instructorId: helen.id,
          customerId: alice.id,
          dateTime: "2024-08-20T07:00:00Z",
          status: "booked",
          isRebookable: false,
          subscriptionId: alice.subscription[0].id,
          recurringClassId: 1,
        },
        {
          instructorId: helen.id,
          customerId: alice.id,
          dateTime: "2024-08-27T07:00:00Z",
          status: "booked",
          subscriptionId: alice.subscription[0].id,
          recurringClassId: 1,
        },
        // {
        //   instructorId: helen.id,
        //   customerId: bob.id,
        //   dateTime: "2024-06-03T15:30:00+09:00",
        //   status: "completed",
        //   isRebookable: false,
        //   subscriptionId: bob.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: elian.id,
        //   customerId: bob.id,
        //   dateTime: "2024-06-03T16:00:00+09:00",
        //   status: "completed",
        //   isRebookable: false,
        //   subscriptionId: bob.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: elian.id,
        //   customerId: bob.id,
        //   dateTime: "2024-06-29T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: bob.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-08T10:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: bob.id,
        //   dateTime: "2024-08-08T10:30:00+09:00",
        //   status: "booked",
        //   subscriptionId: bob.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-08T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: bob.id,
        //   dateTime: "2024-08-08T11:30:00+09:00",
        //   status: "booked",
        //   subscriptionId: bob.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-08T12:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: bob.id,
        //   dateTime: "2024-08-08T12:30:00+09:00",
        //   status: "booked",
        //   subscriptionId: bob.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-08T13:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: bob.id,
        //   dateTime: "2024-08-08T13:30:00+09:00",
        //   status: "booked",
        //   subscriptionId: bob.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-08T14:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: bob.id,
        //   dateTime: "2024-08-08T14:30:00+09:00",
        //   status: "booked",
        //   subscriptionId: bob.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-08T15:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        //   isRebookable: true,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-13T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-14T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-14T12:00:00+09:00",
        //   status: "completed",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-14T13:00:00+09:00",
        //   status: "canceledByInstructor",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-14T14:00:00+09:00",
        //   status: "canceledByCustomer",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-15T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-16T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-17T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-19T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-20T11:00:00+09:00",
        //   status: "canceledByCustomer",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-21T11:00:00+09:00",
        //   status: "canceledByInstructor",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-22T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
        // {
        //   instructorId: helen.id,
        //   customerId: alice.id,
        //   dateTime: "2024-08-23T11:00:00+09:00",
        //   status: "booked",
        //   subscriptionId: alice.subscription[0].id,
        //   recurringClassId: 1,
        // },
      ],
    });
  });
}
function insertChildren() {
  return __awaiter(this, void 0, void 0, function* () {
    const alice = yield getCustomer("Alice");
    // const bob = await getCustomer("Bob");
    yield prisma.children.createMany({
      data: [
        {
          name: "Peppa",
          customerId: alice.id,
          birthdate: new Date("2018-05-15"),
          personalInfo:
            "Age: 6 years, English Level: Beginner. Enjoys playing with friends and loves jumping in muddy puddles.",
        },
        {
          name: "Suzy",
          customerId: alice.id,
          birthdate: new Date("2018-06-20"),
          personalInfo:
            "Age: 6 years, English Level: Beginner. Likes playing with dolls and has a pet sheep named Woolly.",
        },
        // {
        //   name: "Emily",
        //   customerId: bob.id,
        //   birthdate: new Date("2017-11-02"),
        //   personalInfo:
        //     "Age: 7 years, English Level: Intermediate. Loves drawing and is very creative. Enjoys reading stories.",
        // },
      ],
    });
  });
}
function insertClassAttendance() {
  return __awaiter(this, void 0, void 0, function* () {
    const customers = yield prisma.customer.findMany();
    const classes = yield prisma.class.findMany();
    const children = yield prisma.children.findMany();
    if (classes.length < 4 || children.length < 1) {
      throw new Error("Not enough classes or children found");
    }
    yield prisma.classAttendance.createMany({
      data: [
        { classId: classes[0].id, childrenId: children[0].id },
        // { classId: classes[0].id, childrenId: children[1].id },
        { classId: classes[1].id, childrenId: children[0].id },
        { classId: classes[2].id, childrenId: children[0].id },
        { classId: classes[3].id, childrenId: children[0].id },
        { classId: classes[4].id, childrenId: children[0].id },
        { classId: classes[5].id, childrenId: children[0].id },
        { classId: classes[6].id, childrenId: children[0].id },
        { classId: classes[7].id, childrenId: children[0].id },
      ],
    });
    // if (classes.length < 17 || children.length < 2) {
    //   throw new Error("Not enough classes or children found");
    // }
    // const august8ClassIds = classes.slice(6, 17).map((c) => c.id);
    // if (august8ClassIds.length !== 11) {
    //   throw new Error("August 8th class IDs count mismatch");
    // }
    // const aliceChildren = children.filter(
    //   (child) => child.customerId === customers[0].id,
    // );
    // const attendanceData = august8ClassIds.flatMap((classId) =>
    //   aliceChildren.map((child) => ({
    //     classId,
    //     childrenId: child.id,
    //   })),
    // );
    // await prisma.classAttendance.createMany({
    //   data: attendanceData,
    // });
  });
}
function insertPlans() {
  return __awaiter(this, void 0, void 0, function* () {
    yield prisma.plan.createMany({
      data: [
        {
          name: "3,180 yen/month",
          description: "2 classes per week",
          weeklyClassTimes: 2,
        },
        {
          name: "7,980 yen/month",
          description: "5 classes per week",
          weeklyClassTimes: 5,
        },
      ],
    });
  });
}
function insertSubscriptions() {
  return __awaiter(this, void 0, void 0, function* () {
    const alice = yield getCustomer("Alice");
    // const bob = await getCustomer("Bob");
    const plan1 = yield getPlan("3,180 yen/month");
    const plan2 = yield getPlan("7,980 yen/month");
    yield prisma.subscription.createMany({
      data: [
        {
          customerId: alice.id,
          planId: plan1.id,
          startAt: new Date("2024-08-01"),
          endAt: null,
        },
        // {
        //   customerId: bob.id,
        //   planId: plan2.id,
        //   startAt: new Date("2024-06-01"),
        //   endAt: null,
        // },
      ],
    });
  });
}
function insertRecurringClasses() {
  return __awaiter(this, void 0, void 0, function* () {
    const alice = yield getCustomer("Alice");
    const helen = yield getInstructor("Helen");
    // const elian = await getInstructor("Elian");
    yield prisma.recurringClass.create({
      data: {
        subscriptionId: alice.subscription[0].id,
        instructorId: helen.id,
        startAt: "2024-08-05T00:00:00Z",
        recurringClassAttendance: {
          create: [
            {
              childrenId: alice.children[0].id,
            },
            // {
            //   childrenId: alice.children[1].id,
            // },
          ],
        },
      },
    });
    yield prisma.recurringClass.create({
      data: {
        subscriptionId: alice.subscription[0].id,
        instructorId: helen.id,
        startAt: "2024-08-06T00:00:00Z",
        recurringClassAttendance: {
          create: [
            {
              childrenId: alice.children[0].id,
            },
          ],
        },
      },
    });
    // await prisma.recurringClass.create({
    //   data: {
    //     subscriptionId: alice.subscription[0].id,
    //     instructorId: elian.id,
    //     startAt: "2024-07-03T02:00:00Z",
    //     endAt: "2024-08-01T00:00:00Z",
    //     recurringClassAttendance: {
    //       create: [
    //         {
    //           childrenId: alice.children[0].id,
    //         },
    //       ],
    //     },
    //   },
    // });
    // await prisma.recurringClass.create({
    //   data: {
    //     subscriptionId: alice.subscription[0].id,
    //     instructorId: elian.id,
    //     startAt: "2024-07-18T03:00:00Z",
    //     endAt: "2024-09-01T00:00:00Z",
    //     recurringClassAttendance: {
    //       create: [
    //         {
    //           childrenId: alice.children[0].id,
    //         },
    //         {
    //           childrenId: alice.children[1].id,
    //         },
    //       ],
    //     },
    //   },
    // });
    // await prisma.recurringClass.create({
    //   data: {
    //     subscriptionId: alice.subscription[0].id,
    //     instructorId: elian.id,
    //     startAt: "2024-08-23T01:00:00Z",
    //     endAt: "2024-10-01T00:00:00Z",
    //     recurringClassAttendance: {
    //       create: [
    //         {
    //           childrenId: alice.children[0].id,
    //         },
    //         {
    //           childrenId: alice.children[1].id,
    //         },
    //       ],
    //     },
    //   },
    // });
    // await prisma.recurringClass.create({
    //   data: {
    //     subscriptionId: alice.subscription[0].id,
    //     instructorId: elian.id,
    //     startAt: "2024-09-02T04:00:00Z",
    //     recurringClassAttendance: {
    //       create: [
    //         {
    //           childrenId: alice.children[0].id,
    //         },
    //       ],
    //     },
    //   },
    // });
  });
}
function insertInstructorUnavailabilities() {
  return __awaiter(this, void 0, void 0, function* () {
    const helen = yield getInstructor("Helen");
    const elian = yield getInstructor("Elian");
    yield prisma.instructorUnavailability.createMany({
      data: [
        {
          instructorId: helen.id,
          dateTime: new Date("2024-08-20T07:30:00Z"),
        },
        {
          instructorId: helen.id,
          dateTime: new Date("2024-08-22T07:30:00Z"),
        },
      ],
    });
  });
}
function getCustomer(name) {
  return __awaiter(this, void 0, void 0, function* () {
    const customer = yield prisma.customer.findFirst({
      where: { name },
      include: { children: true, subscription: true },
    });
    if (!customer) {
      throw new Error(`Customer ${name} not found`);
    }
    // Include only active subscriptions.
    customer.subscription = customer.subscription.filter(
      ({ endAt }) => endAt === null,
    );
    return customer;
  });
}
function getInstructor(nickname) {
  return __awaiter(this, void 0, void 0, function* () {
    const customer = yield prisma.instructor.findFirst({ where: { nickname } });
    if (!customer) {
      throw new Error(`Customer ${nickname} not found`);
    }
    return customer;
  });
}
function getPlan(name) {
  return __awaiter(this, void 0, void 0, function* () {
    const plan = yield prisma.plan.findFirst({ where: { name } });
    if (!plan) {
      throw new Error(`Plan ${name} not found`);
    }
    return plan;
  });
}
function deleteAll(table) {
  return __awaiter(this, void 0, void 0, function* () {
    // @ts-ignore
    yield prisma[table].deleteMany({});
  });
}
function main() {
  return __awaiter(this, void 0, void 0, function* () {
    {
      // Dependent on the below
      yield deleteAll("classAttendance");
      yield deleteAll("recurringClassAttendance");
      // Dependent on the below
      yield deleteAll("class");
      yield deleteAll("recurringClass");
      yield deleteAll("instructorAvailability");
      // Dependent on the below
      yield deleteAll("children");
      yield deleteAll("subscription");
      yield deleteAll("instructorRecurringAvailability");
      // Independent
      yield deleteAll("admins");
      yield deleteAll("instructor");
      yield deleteAll("customer");
      yield deleteAll("plan");
      yield deleteAll("instructorUnavailability");
    }
    {
      // Independent
      yield insertPlans();
      yield insertCustomers();
      yield insertInstructors();
      yield insertAdmins();
      // Dependant on the above
      yield insertInstructorAvailabilities();
      yield insertSubscriptions();
      yield insertChildren();
      // Dependant on the above
      yield insertRecurringClasses();
      yield insertClasses();
      // Dependant on the above
      // await insertInstructorUnavailabilities();
      // Dependant on the above
      yield insertClassAttendance();
    }
  });
}
main();
