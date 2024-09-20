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
        classURL: "https://zoom.us/j/123456789?pwd=helen",
        meetingId: "123 456 7890",
        passcode: "helen",
        password:
          "$2b$12$lzg9z2HDTl/dwd8DSnGHJOdPIYiFvn40fwEzRtimoty5VtOugaTfa", // password: helen
        introductionURL:
          "https://select-type.com/rsv/?id=9krPgyM7znE&c_id=129259",
      },
    });
    yield prisma.instructor.create({
      data: {
        email: "elian@example.com",
        name: "Elian P.Quilisadio",
        nickname: "Elian",
        icon: "elian-1.jpg",
        classURL: "https://zoom.us/j/2345678901?pwd=elian",
        meetingId: "234 567 8901",
        passcode: "elian",
        password:
          "$2b$12$Oe8qdMedbkuqhY31pgkH7OaMukvbUawE63inMCoDSeY5CHRS3Gc.u", // password: elian
        introductionURL:
          "https://select-type.com/rsv/?id=9krPgyM7znE&c_id=127929",
      },
    });
  });
}
function insertInstructorAvailabilities() {
  return __awaiter(this, void 0, void 0, function* () {
    const helen = yield getInstructor("Helen");
    yield prisma.instructorRecurringAvailability.create({
      data: {
        startAt: "2024-08-05T08:00:00Z", // Mon 17:00 JST
        instructorId: helen.id,
        instructorAvailability: {
          create: createDates("2024-08-05T08:00:00Z").map((dateTime) => ({
            dateTime,
            instructorId: helen.id,
          })),
        },
      },
    });
    yield prisma.instructorRecurringAvailability.create({
      data: {
        startAt: "2024-08-05T08:30:00Z", // Mon 17:30 JST
        instructorId: helen.id,
        instructorAvailability: {
          create: createDates("2024-08-05T08:30:00Z").map((dateTime) => ({
            dateTime,
            instructorId: helen.id,
          })),
        },
      },
    });
    yield prisma.instructorRecurringAvailability.create({
      data: {
        startAt: "2024-08-06T08:30:00Z", // Tue 17:30 JST
        instructorId: helen.id,
        instructorAvailability: {
          create: createDates("2024-08-06T08:30:00Z").map((dateTime) => ({
            dateTime,
            instructorId: helen.id,
          })),
        },
      },
    });
    const elian = yield getInstructor("Elian");
    yield prisma.instructorRecurringAvailability.create({
      data: {
        startAt: "2024-08-05T08:00:00Z", // Mon 17:00 JST
        instructorId: elian.id,
        instructorAvailability: {
          create: createDates("2024-08-05T08:00:00Z").map((dateTime) => ({
            dateTime,
            instructorId: elian.id,
          })),
        },
      },
    });
    yield prisma.instructorRecurringAvailability.create({
      data: {
        startAt: "2024-08-05T08:30:00Z", // Mon 17:30 JST
        instructorId: elian.id,
        instructorAvailability: {
          create: createDates("2024-08-05T08:30:00Z").map((dateTime) => ({
            dateTime,
            instructorId: elian.id,
          })),
        },
      },
    });
    yield prisma.instructorRecurringAvailability.create({
      data: {
        startAt: "2024-08-06T08:30:00Z", // Tue 17:30 JST
        instructorId: elian.id,
        instructorAvailability: {
          create: createDates("2024-08-06T08:30:00Z").map((dateTime) => ({
            dateTime,
            instructorId: elian.id,
          })),
        },
      },
    });
  });
}
function insertCustomers() {
  return __awaiter(this, void 0, void 0, function* () {
    yield prisma.customer.createMany({
      data: [
        {
          name: "Shingo",
          email: "shingo@example.com",
          password: "shingo",
          prefecture: "Tokyo",
        },
        {
          name: "Alice",
          email: "alice@example.com",
          password: "alice",
          prefecture: "Tokyo",
        },
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
function insertChildren() {
  return __awaiter(this, void 0, void 0, function* () {
    const shingo = yield getCustomer("Shingo");
    const alice = yield getCustomer("Alice");
    yield prisma.children.createMany({
      data: [
        {
          name: "Ken",
          customerId: shingo.id,
          birthdate: new Date("2020-01-01"),
          personalInfo:
            "English Level: Beginner. Enjoys playing the piano and loves the Beatles.",
        },
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
          birthdate: new Date("2018-08-27"),
          personalInfo:
            "Age: 6 years, English Level: Beginner. Likes playing with dolls and has a pet sheep named Woolly.",
        },
      ],
    });
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
    const shingo = yield getCustomer("Shingo");
    const alice = yield getCustomer("Alice");
    const plan1 = yield getPlan("3,180 yen/month");
    yield prisma.subscription.createMany({
      data: [
        {
          customerId: shingo.id,
          planId: plan1.id,
          startAt: new Date("2024-08-01"),
          endAt: null,
        },
        {
          customerId: alice.id,
          planId: plan1.id,
          startAt: new Date("2024-08-01"),
          endAt: null,
        },
      ],
    });
  });
}
function insertRecurringClasses() {
  return __awaiter(this, void 0, void 0, function* () {
    const shingo = yield getCustomer("Shingo");
    yield prisma.recurringClass.createMany({
      data: [
        {
          subscriptionId: shingo.subscription[0].id,
        },
        {
          subscriptionId: shingo.subscription[0].id,
        },
      ],
    });
    const alice = yield getCustomer("Alice");
    const elian = yield getInstructor("Elian");
    yield prisma.recurringClass.create({
      data: {
        subscriptionId: alice.subscription[0].id,
        instructorId: elian.id,
        startAt: "2024-08-05T08:00:00Z", // Mon 17:00 JST
        recurringClassAttendance: {
          create: [
            {
              childrenId: alice.children[0].id,
            },
          ],
        },
        classes: {
          create: createDates("2024-08-05T08:00:00Z").map((dateTime) => ({
            instructorId: elian.id,
            customerId: alice.id,
            subscriptionId: alice.subscription[0].id,
            dateTime,
            status: "booked",
            isRebookable: true,
            classAttendance: {
              create: {
                childrenId: alice.children[0].id,
              },
            },
          })),
        },
      },
    });
    yield prisma.recurringClass.create({
      data: {
        subscriptionId: alice.subscription[0].id,
        instructorId: elian.id,
        startAt: "2024-08-05T08:30:00Z", // Mon 17:30 JST
        recurringClassAttendance: {
          create: [
            {
              childrenId: alice.children[0].id,
            },
            {
              childrenId: alice.children[1].id,
            },
          ],
        },
        classes: {
          create: createDates("2024-08-05T08:30:00Z").map((dateTime) => ({
            instructorId: elian.id,
            customerId: alice.id,
            subscriptionId: alice.subscription[0].id,
            dateTime,
            status: "booked",
            isRebookable: true,
            classAttendance: {
              create: [
                {
                  childrenId: alice.children[0].id,
                },
                {
                  childrenId: alice.children[1].id,
                },
              ],
            },
          })),
        },
      },
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
// Create dates from start to 2024-11-01 every week.
function createDates(start) {
  const dates = [];
  const date = new Date(start);
  const end = new Date("2024-11-01T00:00:00Z");
  while (date < end) {
    dates.push(new Date(date).toISOString());
    date.setDate(date.getDate() + 7);
  }
  return dates;
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
    // Instructor Helen is empty.
    // Instructor Elian has 3 availabilities and 2 classes with Alice.
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
    }
  });
}
main();
