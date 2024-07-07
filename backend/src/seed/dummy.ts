import "dotenv/config";
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

async function insertLessonAttendance() {
  const lessons = await prisma.lesson.findMany();
  const children = await prisma.children.findMany();

  if (lessons.length < 6 || children.length < 3) {
    throw new Error("Not enough lessons or children found");
  }

  await prisma.lessonAttendance.createMany({
    data: [
      { lessonId: lessons[0].id, childrenId: children[0].id },
      { lessonId: lessons[0].id, childrenId: children[1].id },
      { lessonId: lessons[1].id, childrenId: children[0].id },
      { lessonId: lessons[2].id, childrenId: children[2].id },
      { lessonId: lessons[3].id, childrenId: children[2].id },
    ],
  });
}

async function main() {
  await prisma.lessonAttendance.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.instructorAvailability.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.admins.deleteMany({});
  await prisma.children.deleteMany({});
  await prisma.customer.deleteMany({});

  await insertInstructors();
  await insertCustomers();
  await insertAdmins();
  await insertLessons();
  await insertChildren();
  await insertLessonAttendance();
}

main();
