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
      classLink: "https://zoom.us/j/12345?pwd=ABCde",
      password: "$2b$12$lzg9z2HDTl/dwd8DSnGHJOdPIYiFvn40fwEzRtimoty5VtOugaTfa", // password: helen
    },
  });
  await prisma.instructor.create({
    data: {
      email: "elian@example.com",
      name: "Elian P.Quilisadio",
      nickname: "Elian",
      icon: "elian-1.jpg",
      classLink: "https://zoom.us/j/67890?pwd=FGHij",
      password: "$2b$12$R6tfoOzHAHCC2NgD7HZVtutBQsoWysLtdpWEKGYlkHbeGvMa.WSUe", // password: Elian
    },
  });
}

async function insertInstructorAvailabilities() {
  const helen = await getInstructor("Helen");
  const elian = await getInstructor("Elian");
  await prisma.instructorRecurringAvailability.createMany({
    data: [
      { startAt: "2024-07-01T00:00:00Z", instructorId: helen.id }, // 09:00 in Japan
      { startAt: "2024-07-01T00:30:00Z", instructorId: helen.id }, // 09:30 in Japan
      { startAt: "2024-07-01T01:00:00Z", instructorId: elian.id }, // 10:00 in Japan
      { startAt: "2024-07-02T01:00:00Z", instructorId: elian.id }, // 10:00 in Japan
      {
        startAt: "2024-07-02T01:30:00Z",
        instructorId: elian.id,
        endAt: "2024-07-23T23:59:59Z",
      }, // 10:30 in Japan
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

  await insertAvailabilities(helen.id, "2024-07-01T00:00:00Z", [
    "2024-07-01T00:00:00Z",
    "2024-07-08T00:00:00Z",
    "2024-07-15T00:00:00Z",
    "2024-07-22T00:00:00Z",
    "2024-07-29T00:00:00Z",
  ]);
  await insertAvailabilities(helen.id, "2024-07-01T00:30:00Z", [
    "2024-07-01T00:30:00Z",
    "2024-07-08T00:30:00Z",
    "2024-07-15T00:30:00Z",
    "2024-07-22T00:30:00Z",
    "2024-07-29T00:30:00Z",
  ]);
  await insertAvailabilities(elian.id, "2024-07-01T01:00:00Z", [
    "2024-07-01T01:00:00Z",
    "2024-07-08T01:00:00Z",
    "2024-07-15T01:00:00Z",
    "2024-07-22T01:00:00Z",
    "2024-07-29T01:00:00Z",
  ]);
  await insertAvailabilities(elian.id, "2024-07-02T01:00:00Z", [
    "2024-07-02T01:00:00Z",
    "2024-07-09T01:00:00Z",
    "2024-07-16T01:00:00Z",
    "2024-07-23T01:00:00Z",
    "2024-07-30T01:00:00Z",
  ]);
  await insertAvailabilities(elian.id, "2024-07-02T01:30:00Z", [
    "2024-07-02T01:30:00Z",
    "2024-07-09T01:30:00Z",
    "2024-07-16T01:30:00Z",
    "2024-07-23T01:30:00Z",
  ]);
}

async function insertCustomers() {
  await prisma.customer.createMany({
    data: [
      {
        name: "Alice",
        email: "alice@example.com",
        password: "alice",
      },
      {
        name: "Bob",
        email: "bob@example.com",
        password: "bob",
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
        subscriptionId: alice.subscription[0].id,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2024-06-01T11:30:00+09:00",
        status: "completed",
        subscriptionId: alice.subscription[0].id,
      },
      {
        instructorId: helen.id,
        customerId: bob.id,
        dateTime: "2024-06-03T15:00:00+09:00",
        status: "canceled",
        subscriptionId: bob.subscription[0].id,
      },
      {
        instructorId: helen.id,
        customerId: bob.id,
        dateTime: "2024-06-03T15:30:00+09:00",
        status: "completed",
        subscriptionId: bob.subscription[0].id,
      },
      {
        instructorId: elian.id,
        customerId: bob.id,
        dateTime: "2024-06-03T16:00:00+09:00",
        status: "completed",
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
      },
      {
        name: "Suzy",
        customerId: alice.id,
      },
      {
        name: "Emily",
        customerId: bob.id,
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
      },
      {
        name: "7,980 yen/month",
        description: "5 times a week",
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
      rrule: "DTSTART:20240701T000000Z\nRRULE:FREQ=WEEKLY",
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
      rrule: "DTSTART:20240703T000000Z\nRRULE:FREQ=WEEKLY",
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
