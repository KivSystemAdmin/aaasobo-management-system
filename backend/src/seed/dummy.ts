import "dotenv/config";
import { PrismaClient } from "@prisma/client";

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
  const helen = await prisma.instructor.findFirst({
    where: { nickname: "Helen" },
  });
  if (!helen) {
    throw new Error("Instructor not found");
  }
  const ed = await prisma.instructor.findFirst({
    where: { nickname: "Elian" },
  });
  if (!ed) {
    throw new Error("Instructor not found");
  }
  await prisma.instructorRecurringAvailability.createMany({
    data: [
      { startAt: "2024-07-01T00:00:00Z", instructorId: helen.id }, // 09:00 in Japan
      { startAt: "2024-07-01T00:30:00Z", instructorId: helen.id }, // 09:30 in Japan
      { startAt: "2024-07-01T01:00:00Z", instructorId: ed.id }, // 10:00 in Japan
      { startAt: "2024-07-02T01:00:00Z", instructorId: ed.id }, // 10:00 in Japan
      {
        startAt: "2024-07-02T01:30:00Z",
        instructorId: ed.id,
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
  await insertAvailabilities(ed.id, "2024-07-01T01:00:00Z", [
    "2024-07-01T01:00:00Z",
    "2024-07-08T01:00:00Z",
    "2024-07-15T01:00:00Z",
    "2024-07-22T01:00:00Z",
    "2024-07-29T01:00:00Z",
  ]);
  await insertAvailabilities(ed.id, "2024-07-02T01:00:00Z", [
    "2024-07-02T01:00:00Z",
    "2024-07-09T01:00:00Z",
    "2024-07-16T01:00:00Z",
    "2024-07-23T01:00:00Z",
    "2024-07-30T01:00:00Z",
  ]);
  await insertAvailabilities(ed.id, "2024-07-02T01:30:00Z", [
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
  const alice = await prisma.customer.findFirst({ where: { name: "Alice" } });
  if (!alice) {
    throw new Error("Customer not found");
  }
  const aliceSubscription = await prisma.subscription.findFirst({
    where: { customerId: alice.id, endAt: null },
  });
  if (!aliceSubscription) {
    throw new Error("Subscription not found");
  }
  const bob = await prisma.customer.findFirst({ where: { name: "Bob" } });
  if (!bob) {
    throw new Error("Customer not found");
  }
  const bobSubscription = await prisma.subscription.findFirst({
    where: { customerId: bob.id, endAt: null },
  });
  if (!bobSubscription) {
    throw new Error("Subscription not found");
  }

  const helen = await prisma.instructor.findFirst({
    where: { name: "Helene Gay Santos" },
  });
  if (!helen) {
    throw new Error("Instructor not found");
  }
  const elian = await prisma.instructor.findFirst({
    where: { name: "Elian P.Quilisadio" },
  });
  if (!elian) {
    throw new Error("Instructor not found");
  }

  await prisma.class.createMany({
    data: [
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2024-06-01T11:00:00+09:00",
        status: "completed",
        subscriptionId: aliceSubscription.id,
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2024-06-01T11:30:00+09:00",
        status: "completed",
        subscriptionId: aliceSubscription.id,
      },
      {
        instructorId: helen.id,
        customerId: bob.id,
        dateTime: "2024-06-03T15:00:00+09:00",
        status: "canceled",
        subscriptionId: bobSubscription.id,
      },
      {
        instructorId: helen.id,
        customerId: bob.id,
        dateTime: "2024-06-03T15:30:00+09:00",
        status: "completed",
        subscriptionId: bobSubscription.id,
      },
      {
        instructorId: elian.id,
        customerId: bob.id,
        dateTime: "2024-06-03T16:00:00+09:00",
        status: "completed",
        subscriptionId: bobSubscription.id,
      },
      {
        instructorId: elian.id,
        customerId: bob.id,
        dateTime: "2024-06-29T11:00:00+09:00",
        status: "booked",
        subscriptionId: bobSubscription.id,
      },
    ],
  });
}

async function insertChildren() {
  const alice = await prisma.customer.findFirst({ where: { name: "Alice" } });
  if (!alice) {
    throw new Error("Customer not found");
  }
  const bob = await prisma.customer.findFirst({ where: { name: "Bob" } });
  if (!bob) {
    throw new Error("Customer not found");
  }

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
        name: "Once a Week",
        tokens: 4,
      },
      {
        name: "Twice a Week",
        tokens: 8,
      },
    ],
  });
}

async function insertSubscriptions() {
  const alice = await prisma.customer.findFirst({ where: { name: "Alice" } });
  if (!alice) {
    throw new Error("Customer not found");
  }
  const bob = await prisma.customer.findFirst({ where: { name: "Bob" } });
  if (!bob) {
    throw new Error("Customer not found");
  }
  const plan1 = await prisma.plan.findFirst({ where: { name: "Once a Week" } });
  if (!plan1) {
    throw new Error("Plan not found");
  }
  const plan2 = await prisma.plan.findFirst({
    where: { name: "Twice a Week" },
  });
  if (!plan2) {
    throw new Error("Plan not found");
  }
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

async function main() {
  await prisma.classAttendance.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.plan.deleteMany({});
  await prisma.instructorAvailability.deleteMany({});
  await prisma.instructorRecurringAvailability.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.admins.deleteMany({});
  await prisma.children.deleteMany({});
  await prisma.customer.deleteMany({});

  await insertInstructors();
  await insertInstructorAvailabilities();
  await insertCustomers();
  await insertAdmins();
  await insertPlans();
  await insertSubscriptions();
  await insertClasses();
  await insertChildren();
  await insertClassAttendance();
}

main();
