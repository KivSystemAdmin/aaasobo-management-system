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
      classURL: "https://zoom.us/j/12345?pwd=ABCde",
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
      classURL: "https://zoom.us/j/67890?pwd=FGHij",
      meetingId: "234 567 8901",
      passcode: "elian",
      password: "$2b$12$Oe8qdMedbkuqhY31pgkH7OaMukvbUawE63inMCoDSeY5CHRS3Gc.u", // password: elian
      introductionURL:
        "https://select-type.com/rsv/?id=9krPgyM7znE&c_id=127929",
    },
  });
}

async function insertInstructorAvailabilities() {
  const helen = await getInstructor("Helen");
  const elian = await getInstructor("Elian");
  await prisma.instructorRecurringAvailability.createMany({
    data: [
      { startAt: "2024-07-01T07:00:00Z", instructorId: helen.id }, // 16:00 in Japan
      { startAt: "2024-07-01T07:30:00Z", instructorId: helen.id }, // 16:30 in Japan
      { startAt: "2024-07-01T08:00:00Z", instructorId: elian.id }, // 17:00 in Japan
      { startAt: "2024-07-02T08:00:00Z", instructorId: elian.id }, // 17:00 in Japan
      {
        startAt: "2024-07-02T08:30:00Z",
        instructorId: elian.id,
        endAt: "2024-07-24T00:00:00Z",
      }, // 17:30 in Japan
    ],
  });

  const insertAvailabilities = async (
    instructorId: number,
    startAt: string,
    dateTimes: string[],
  ) => {
    const r = await prisma.instructorRecurringAvailability.findFirst({
      where: { instructorId, startAt },
    });
    if (!r) {
      throw new Error("Recurring availability not found");
    }
    await prisma.instructorAvailability.createMany({
      data: dateTimes.map((dateTime) => ({
        dateTime,
        instructorId,
        instructorRecurringAvailabilityId: r!.id,
      })),
    });
  };

  await insertAvailabilities(helen.id, "2024-07-01T07:00:00Z", [
    "2024-07-01T07:00:00Z",
    "2024-07-08T07:00:00Z",
    "2024-07-15T07:00:00Z",
    "2024-07-22T07:00:00Z",
    "2024-07-29T07:00:00Z",
  ]);
  await insertAvailabilities(helen.id, "2024-07-01T07:30:00Z", [
    "2024-07-01T07:30:00Z",
    "2024-07-08T07:30:00Z",
    "2024-07-15T07:30:00Z",
    "2024-07-22T07:30:00Z",
    "2024-07-27T07:30:00Z",
    "2024-07-29T07:30:00Z",
    "2024-07-30T07:30:00Z",
    "2024-07-31T07:30:00Z",
    "2024-08-01T07:30:00Z",
    "2024-08-02T07:30:00Z",
    "2024-08-03T07:30:00Z",
    "2024-08-04T07:30:00Z",
    "2024-08-05T07:30:00Z",
    "2024-08-06T07:30:00Z",
    "2024-08-07T07:30:00Z",
    "2024-08-08T07:30:00Z",
    "2024-08-09T07:30:00Z",
    "2024-08-10T07:30:00Z",
    "2024-08-11T07:30:00Z",
    "2024-08-12T07:30:00Z",
    "2024-08-13T07:30:00Z",
    "2024-08-14T07:30:00Z",
    "2024-08-15T07:30:00Z",
    "2024-08-16T07:30:00Z",
    "2024-08-17T07:30:00Z",
    "2024-08-18T07:30:00Z",
    "2024-08-19T07:30:00Z",
    "2024-08-20T07:30:00Z",
    "2024-08-21T07:30:00Z",
    "2024-08-22T07:30:00Z",
    "2024-08-23T07:30:00Z",
  ]);
  await insertAvailabilities(elian.id, "2024-07-01T08:00:00Z", [
    "2024-07-01T08:00:00Z",
    "2024-07-08T08:00:00Z",
    "2024-07-15T08:00:00Z",
    "2024-07-22T08:00:00Z",
    "2024-07-29T08:00:00Z",
    "2024-08-03T07:30:00Z",
    "2024-08-04T07:30:00Z",
    "2024-08-05T07:30:00Z",
    "2024-08-06T07:30:00Z",
  ]);
  await insertAvailabilities(elian.id, "2024-07-02T08:00:00Z", [
    "2024-07-02T08:00:00Z",
    "2024-07-09T08:00:00Z",
    "2024-07-16T08:00:00Z",
    "2024-07-23T08:00:00Z",
    "2024-07-30T08:00:00Z",
  ]);
  await insertAvailabilities(elian.id, "2024-07-02T08:30:00Z", [
    "2024-07-02T08:30:00Z",
    "2024-07-09T08:30:00Z",
    "2024-07-16T08:30:00Z",
    "2024-07-23T08:30:00Z",
  ]);
}

async function insertCustomers() {
  await prisma.customer.createMany({
    data: [
      {
        name: "Alice",
        email: "alice@example.com",
        password: "alice",
        prefecture: "Aomori",
      },
      {
        name: "Bob",
        email: "bob@example.com",
        password: "bob",
        prefecture: "Hokkaido",
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

async function insertClasses() {
  const alice = await getCustomer("Alice");
  const bob = await getCustomer("Bob");
  const helen = await getInstructor("Helen");
  const elian = await getInstructor("Elian");

  await prisma.class.createMany({
    data: [
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2024-06-01T11:00:00+09:00",
        status: "completed",
        isRebookable: false,
        subscriptionId: alice.subscription[0].id,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2024-06-01T11:30:00+09:00",
        status: "completed",
        isRebookable: false,
        subscriptionId: alice.subscription[0].id,
      },
      {
        instructorId: helen.id,
        customerId: bob.id,
        dateTime: "2024-06-03T15:00:00+09:00",
        status: "canceledByCustomer",
        subscriptionId: bob.subscription[0].id,
      },
      {
        instructorId: helen.id,
        customerId: bob.id,
        dateTime: "2024-06-03T15:30:00+09:00",
        status: "completed",
        isRebookable: false,
        subscriptionId: bob.subscription[0].id,
      },
      {
        instructorId: elian.id,
        customerId: bob.id,
        dateTime: "2024-06-03T16:00:00+09:00",
        status: "completed",
        isRebookable: false,
        subscriptionId: bob.subscription[0].id,
      },
      {
        instructorId: elian.id,
        customerId: bob.id,
        dateTime: "2024-06-29T11:00:00+09:00",
        status: "booked",
        subscriptionId: bob.subscription[0].id,
      },
    ],
  });
}

async function insertChildren() {
  const alice = await getCustomer("Alice");
  const bob = await getCustomer("Bob");

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
        birthdate: new Date("2018-06-20"),
        personalInfo:
          "Age: 6 years, English Level: Beginner. Likes playing with dolls and has a pet sheep named Woolly.",
      },
      {
        name: "Emily",
        customerId: bob.id,
        birthdate: new Date("2017-11-02"),
        personalInfo:
          "Age: 7 years, English Level: Intermediate. Loves drawing and is very creative. Enjoys reading stories.",
      },
    ],
  });
}

async function insertClassAttendance() {
  const classes = await prisma.class.findMany();
  const children = await prisma.children.findMany();

  if (classes.length < 6 || children.length < 3) {
    throw new Error("Not enough classes or children found");
  }

  await prisma.classAttendance.createMany({
    data: [
      { classId: classes[0].id, childrenId: children[0].id },
      { classId: classes[0].id, childrenId: children[1].id },
      { classId: classes[1].id, childrenId: children[0].id },
      { classId: classes[2].id, childrenId: children[2].id },
      { classId: classes[3].id, childrenId: children[2].id },
    ],
  });
}

async function insertPlans() {
  await prisma.plan.createMany({
    data: [
      {
        name: "3,180 yen/month",
        description: "twice a week",
        weeklyClassTimes: 2,
      },
      {
        name: "7,980 yen/month",
        description: "5 times a week",
        weeklyClassTimes: 5,
      },
    ],
  });
}

async function insertSubscriptions() {
  const alice = await getCustomer("Alice");
  const bob = await getCustomer("Bob");
  const plan1 = await getPlan("3,180 yen/month");
  const plan2 = await getPlan("7,980 yen/month");

  await prisma.subscription.createMany({
    data: [
      {
        customerId: alice.id,
        planId: plan1.id,
        startAt: new Date("2024-06-01"),
        endAt: null,
      },
      {
        customerId: bob.id,
        planId: plan2.id,
        startAt: new Date("2024-06-01"),
        endAt: null,
      },
    ],
  });
}

async function insertRecurringClasses() {
  const alice = await getCustomer("Alice");
  const helen = await getInstructor("Helen");
  const elian = await getInstructor("Elian");

  await prisma.recurringClass.create({
    data: {
      subscriptionId: alice.subscription[0].id,
      instructorId: helen.id,
      startAt: "2024-07-01T00:00:00Z",
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
    },
  });
  await prisma.recurringClass.create({
    data: {
      subscriptionId: alice.subscription[0].id,
      instructorId: elian.id,
      startAt: "2024-07-03T02:00:00Z",
      endAt: "2024-08-01T00:00:00Z",
      recurringClassAttendance: {
        create: [
          {
            childrenId: alice.children[0].id,
          },
        ],
      },
    },
  });
  await prisma.recurringClass.create({
    data: {
      subscriptionId: alice.subscription[0].id,
      instructorId: elian.id,
      startAt: "2024-07-18T03:00:00Z",
      endAt: "2024-09-01T00:00:00Z",
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
    },
  });
  await prisma.recurringClass.create({
    data: {
      subscriptionId: alice.subscription[0].id,
      instructorId: elian.id,
      startAt: "2024-08-23T01:00:00Z",
      endAt: "2024-10-01T00:00:00Z",
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
    },
  });
  await prisma.recurringClass.create({
    data: {
      subscriptionId: alice.subscription[0].id,
      instructorId: elian.id,
      startAt: "2024-09-02T04:00:00Z",
      recurringClassAttendance: {
        create: [
          {
            childrenId: alice.children[0].id,
          },
        ],
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
  }

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
    await insertClasses();

    // Dependant on the above
    await insertClassAttendance();
  }
}

main();
