import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function insertInstructors() {
  await prisma.instructor.create({
    data: {
      name: "Helen",
      instructorAvailability: {
        create: [
          { dateTime: "2024-06-01T11:00:00+09:00" },
          { dateTime: "2024-06-01T11:30:00+09:00" },
          { dateTime: "2024-06-03T15:00:00+09:00" },
          { dateTime: "2024-06-03T15:30:00+09:00" },
        ],
      },
    },
  });
  await prisma.instructor.create({
    data: {
      name: "Ed",
      instructorAvailability: {
        create: [
          { dateTime: "2024-06-01T11:00:00+09:00" },
          { dateTime: "2024-06-01T12:00:00+09:00" },
          { dateTime: "2024-06-03T15:00:00+09:00" },
          { dateTime: "2024-06-03T16:00:00+09:00" },
          { dateTime: "2024-06-29T15:00:00+09:00" },
        ],
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
      },
      {
        name: "Bob",
        email: "bob@example.com",
        password: "bob",
      },
    ],
  });
}

async function insertLessons() {
  const alice = await prisma.customer.findFirst({ where: { name: "Alice" } });
  if (!alice) {
    throw new Error("Customer not found");
  }
  const bob = await prisma.customer.findFirst({ where: { name: "Bob" } });
  if (!bob) {
    throw new Error("Customer not found");
  }

  const helen = await prisma.instructor.findFirst({ where: { name: "Helen" } });
  if (!helen) {
    throw new Error("Instructor not found");
  }
  const ed = await prisma.instructor.findFirst({ where: { name: "Ed" } });
  if (!ed) {
    throw new Error("Instructor not found");
  }

  await prisma.lesson.createMany({
    data: [
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2024-06-01T11:00:00+09:00",
        status: "completed",
      },
      {
        instructorId: helen.id,
        customerId: alice.id,
        dateTime: "2024-06-01T11:30:00+09:00",
        status: "completed",
      },
      {
        instructorId: helen.id,
        customerId: bob.id,
        dateTime: "2024-06-03T15:00:00+09:00",
        status: "canceled",
      },
      {
        instructorId: helen.id,
        customerId: bob.id,
        dateTime: "2024-06-03T15:30:00+09:00",
        status: "completed",
      },
      {
        instructorId: ed.id,
        customerId: bob.id,
        dateTime: "2024-06-03T16:00:00+09:00",
        status: "completed",
      },
      {
        instructorId: ed.id,
        customerId: bob.id,
        dateTime: "2024-06-29T11:00:00+09:00",
        status: "booked",
      },
    ],
  });
}

async function main() {
  await prisma.lesson.deleteMany({});
  await prisma.instructorAvailability.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.customer.deleteMany({});

  await insertInstructors();
  await insertCustomers();
  await insertLessons();
}

main();
