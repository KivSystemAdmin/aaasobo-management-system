import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function insertInstructors() {
  await prisma.instructor.create({
    data: {
      email: "helen@example.com",
      name: "Helene Gay Santos",
      nickname: "Helen",
      icon: "helen-1.jpg",
      classURL: "https://zoom.us/j/123456789?pwd=helen",
      meetingId: "123 456 7890",
      passcode: "helen",
      password: "$2b$12$lzg9z2HDTl/dwd8DSnGHJOdPIYiFvn40fwEzRtimoty5VtOugaTfa", // password: helen
      introductionURL:
        "https://select-type.com/rsv/?id=9krPgyM7znE&c_id=129259",
    },
  });
  await prisma.instructor.create({
    data: {
      email: "elian@example.com",
      name: "Elian P.Quilisadio",
      nickname: "Elian",
      icon: "elian-1.jpg",
      classURL: "https://zoom.us/j/2345678901?pwd=elian",
      meetingId: "234 567 8901",
      passcode: "elian",
      password: "$2b$12$Oe8qdMedbkuqhY31pgkH7OaMukvbUawE63inMCoDSeY5CHRS3Gc.u", // password: elian
      introductionURL:
        "https://select-type.com/rsv/?id=9krPgyM7znE&c_id=127929",
    },
  });
}

async function insertInstructorAvailabilities() {
  const elian = await getInstructor("Elian");
  await prisma.instructorRecurringAvailability.create({
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
  await prisma.instructorRecurringAvailability.create({
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
  await prisma.instructorRecurringAvailability.create({
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
}

async function insertCustomers() {
  await prisma.customer.createMany({
    data: [
      {
        name: "Alice",
        email: "alice@example.com",
        password: "alice",
        prefecture: "Tokyo",
      },
    ],
  });
}

async function insertAdmins() {
  await prisma.admins.createMany({
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
}

async function insertChildren() {
  const alice = await getCustomer("Alice");

  await prisma.children.createMany({
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
        birthdate: new Date("2018-08-27"),
        personalInfo:
          "Age: 6 years, English Level: Beginner. Likes playing with dolls and has a pet sheep named Woolly.",
      },
    ],
  });
}

async function insertPlans() {
  await prisma.plan.createMany({
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
}

async function insertSubscriptions() {
  const alice = await getCustomer("Alice");
  const plan1 = await getPlan("3,180 yen/month");

  await prisma.subscription.createMany({
    data: [
      {
        customerId: alice.id,
        planId: plan1.id,
        startAt: new Date("2024-08-01"),
        endAt: null,
      },
    ],
  });
}

async function insertRecurringClasses() {
  const alice = await getCustomer("Alice");
  const elian = await getInstructor("Elian");

  await prisma.recurringClass.create({
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
  await prisma.recurringClass.create({
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
}

async function getCustomer(name: "Alice" | "Bob") {
  const customer = await prisma.customer.findFirst({
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
}

async function getInstructor(nickname: "Helen" | "Elian") {
  const customer = await prisma.instructor.findFirst({ where: { nickname } });
  if (!customer) {
    throw new Error(`Customer ${nickname} not found`);
  }
  return customer;
}

async function getPlan(name: "3,180 yen/month" | "7,980 yen/month") {
  const plan = await prisma.plan.findFirst({ where: { name } });
  if (!plan) {
    throw new Error(`Plan ${name} not found`);
  }
  return plan;
}

async function deleteAll(table: Uncapitalize<Prisma.ModelName>) {
  // @ts-ignore
  await prisma[table].deleteMany({});
}

// Create dates from start to 2024-11-01 every week.
function createDates(start: string) {
  const dates = [];
  const date = new Date(start);
  const end = new Date("2024-11-01T00:00:00Z");
  while (date < end) {
    dates.push(new Date(date).toISOString());
    date.setDate(date.getDate() + 7);
  }
  return dates;
}

async function main() {
  {
    // Dependent on the below
    await deleteAll("classAttendance");
    await deleteAll("recurringClassAttendance");

    // Dependent on the below
    await deleteAll("class");
    await deleteAll("recurringClass");
    await deleteAll("instructorAvailability");

    // Dependent on the below
    await deleteAll("children");
    await deleteAll("subscription");
    await deleteAll("instructorRecurringAvailability");

    // Independent
    await deleteAll("admins");
    await deleteAll("instructor");
    await deleteAll("customer");
    await deleteAll("plan");
    await deleteAll("instructorUnavailability");
  }

  // Instructor Helen is empty.
  // Instructor Elian has 3 availabilities and 2 classes with Alice.
  {
    // Independent
    await insertPlans();
    await insertCustomers();
    await insertInstructors();
    await insertAdmins();

    // Dependant on the above
    await insertInstructorAvailabilities();
    await insertSubscriptions();
    await insertChildren();

    // Dependant on the above
    await insertRecurringClasses();
  }
}

main();
