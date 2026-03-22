const { faker } = require("@faker-js/faker");
import { hashPasswordSync } from "../utils/commonUtils";
import { prisma } from "./setup";
import { Prisma, Status } from "../../generated/prisma";

export function setTestDataSeed(seed: number) {
  faker.seed(seed);
}

/**
 * Generate a test admin
 */
export function generateTestAdmin() {
  return {
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password(),
    name: faker.person.fullName(),
  };
}

/**
 * Generate a test customer
 */
export function generateTestCustomer(): {
  email: string;
  password: string;
  name: string;
  prefecture: string;
  emailVerified: Date | null;
} {
  return {
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password(),
    name: faker.person.fullName(),
    prefecture: faker.location.state({ abbreviated: false }),
    emailVerified: new Date(),
  };
}

/**
 * Generate a test instructor
 */
export function generateTestInstructor() {
  const birthdate = faker.date.past({ years: 30 });
  const uniqueId = faker.string.uuid();
  const uniqueDigits = faker.string.numeric(11);
  const uniquePasscode = faker.string.alphanumeric(8);
  const uniqueIcon = `${faker.image.avatar()}?id=${uniqueId}`;
  return {
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password(),
    name: faker.person.fullName(),
    classURL: `https://example.com/class/${uniqueId}`,
    icon: uniqueIcon,
    nickname: `${faker.person.firstName()}_${uniqueId.slice(0, 8)}`,
    birthdate: birthdate.toISOString().split("T")[0], // YYYY-MM-DD format for API
    lifeHistory: faker.lorem.paragraph(),
    favoriteFood: faker.food.dish(),
    hobby: faker.lorem.sentence(),
    messageForChildren: faker.lorem.sentence(),
    workingTime: faker.lorem.words(3),
    skill: faker.lorem.sentence(),
    meetingId: uniqueDigits,
    passcode: uniquePasscode,
    englishBackground: faker.helpers.arrayElement([0, 1, 2]),
  };
}

/**
 * Create an admin in the database
 */
export async function createAdmin(data = generateTestAdmin()) {
  return await prisma.admin.create({
    data: {
      ...data,
      password: hashPasswordSync(data.password),
    },
  });
}

/**
 * Create a customer in the database
 */
export async function createCustomer(data = generateTestCustomer()) {
  return await prisma.customer.create({
    data: {
      ...data,
      password: hashPasswordSync(data.password),
    },
  });
}

/**
 * Create an instructor in the database
 */
export async function createInstructor(data: any = generateTestInstructor()) {
  return await prisma.instructor.create({
    data: {
      ...data,
      birthdate: new Date(data.birthdate),
      password: hashPasswordSync(data.password),
    },
  });
}

/**
 * Generate a test plan
 */
function generateTestPlan() {
  const planNameJpn = faker.lorem.words(2);
  const planNameEng = faker.commerce.productName();
  return {
    name: `${planNameJpn} / ${planNameEng}`,
    weeklyClassTimes: faker.number.int({ min: 1, max: 5 }),
    description: faker.lorem.sentence(),
    englishBackground: faker.helpers.arrayElement([0, 1, 2]),
  };
}

/**
 * Create a plan in the database
 */
export async function createPlan(data = generateTestPlan()) {
  return await prisma.plan.create({ data });
}

/**
 * Generate a test child
 */
export function generateTestChild(customerId: number) {
  return {
    customerId,
    name: faker.person.fullName(),
    birthdate: faker.date.past({ years: 10 }),
    personalInfo: faker.lorem.sentence(),
  };
}

/**
 * Create a child in the database
 */
export async function createChild(
  customerId: number,
  data?: Partial<ReturnType<typeof generateTestChild>>,
) {
  return await prisma.child.create({
    data: {
      ...generateTestChild(customerId),
      ...data,
    },
  });
}

/**
 * Generate a test event
 */
function generateTestEvent() {
  return {
    name: `イベント / Event${faker.number.int({ min: 1000, max: 9999 })}`,
    color: faker.color.rgb(),
  };
}

/**
 * Create an event in the database
 */
export async function createEvent(data = generateTestEvent()) {
  return await prisma.event.create({ data });
}

/**
 * Generate a test subscription
 */
function generateTestSubscription(planId: number, customerId: number) {
  const startAt = faker.date.past();
  return {
    planId,
    customerId,
    selectType: faker.internet.url(),
    startAt,
    endAt: faker.date.future({ refDate: startAt }),
  };
}

/**
 * Create a subscription in the database
 */
export async function createSubscription(
  planId: number,
  customerId: number,
  data?: Partial<ReturnType<typeof generateTestSubscription>>,
) {
  return await prisma.subscription.create({
    data: {
      ...generateTestSubscription(planId, customerId),
      ...data,
    },
  });
}

/**
 * Generate a test schedule
 */
function generateTestSchedule(eventId: number, date?: Date) {
  return {
    eventId,
    date: date || faker.date.future(),
  };
}

/**
 * Create a schedule in the database
 */
export async function createSchedule(eventId: number, date?: Date) {
  return await prisma.schedule.create({
    data: generateTestSchedule(eventId, date),
  });
}

/**
 * Generate a test class
 */
function generateTestClass(
  customerId: number,
  instructorId?: number,
  dateTime?: Date,
) {
  return {
    customerId,
    instructorId: instructorId || null,
    dateTime: dateTime || null,
    status: instructorId ? Status.booked : Status.pending,
    classCode: faker.string.alphanumeric(8).toUpperCase(),
    isFreeTrial: false,
    updatedAt: new Date(),
  };
}

/**
 * Create a class in the database
 */
export async function createClass(
  customerId: number,
  instructorId?: number,
  dateTime?: Date,
  overrides?: Partial<Prisma.ClassUncheckedCreateInput>,
) {
  return await prisma.class.create({
    data: {
      ...generateTestClass(customerId, instructorId, dateTime),
      ...overrides,
    },
  });
}

export async function createInstructorFee(
  instructorId: number,
  data?: Partial<{
    currency: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    trialFee: number;
    regularFee: number;
    cancelFee: number;
    cancelWithoutNoticeFee: number;
  }>,
) {
  return await prisma.instructorFee.create({
    data: {
      instructorId,
      currency: data?.currency ?? "JPY",
      effectiveFrom:
        data?.effectiveFrom ?? new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: data?.effectiveTo === undefined ? null : data.effectiveTo,
      trialFee: data?.trialFee ?? 1000,
      regularFee: data?.regularFee ?? 1000,
      cancelFee: data?.cancelFee ?? 500,
      cancelWithoutNoticeFee: data?.cancelWithoutNoticeFee ?? 0,
    },
  });
}

/**
 * Create a password reset token in the database
 */
export async function createPasswordResetToken(
  email: string,
  expiresInHours: number = 1,
) {
  return await prisma.passwordResetToken.create({
    data: {
      email,
      token: faker.string.alphanumeric(32),
      expires: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    },
  });
}

/**
 * Create a verification token in the database
 */
export async function createVerificationToken(
  email: string,
  expiresInHours: number = 1,
) {
  return await prisma.verificationToken.create({
    data: {
      email,
      token: faker.string.alphanumeric(32),
      expires: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    },
  });
}

/**
 * Create a class attendance record in the database
 */
export async function createClassAttendance(classId: number, childId: number) {
  return await prisma.classAttendance.create({
    data: {
      classId,
      childrenId: childId,
    },
  });
}

/**
 * Generate a test instructor schedule
 */
export function generateTestInstructorSchedule(
  instructorId: number,
  effectiveFrom?: Date,
  effectiveTo?: Date | null,
) {
  return {
    instructorId,
    effectiveFrom: effectiveFrom || faker.date.past(),
    effectiveTo: effectiveTo === undefined ? faker.date.future() : effectiveTo,
    timezone: faker.location.timeZone(),
  };
}

/**
 * Create an instructor schedule in the database
 */
export async function createInstructorSchedule(
  instructorId: number,
  data?: Partial<ReturnType<typeof generateTestInstructorSchedule>>,
) {
  return await prisma.instructorSchedule.create({
    data: {
      ...generateTestInstructorSchedule(instructorId),
      ...data,
    },
  });
}

/**
 * Create an instructor slot in the database
 */
export async function createInstructorSlot(
  scheduleId: number,
  weekday: number,
  startTime: Date,
) {
  return await prisma.instructorSlot.create({
    data: {
      scheduleId,
      weekday,
      startTime,
    },
  });
}

/**
 * Create an instructor absence in the database
 */
export async function createInstructorAbsence(
  instructorId: number,
  absentAt: Date,
) {
  return await prisma.instructorAbsence.create({
    data: {
      instructorId,
      absentAt,
    },
  });
}

/**
 * Generate a JWT token for testing authenticated endpoints
 */
async function generateAuthToken(
  userId: number,
  userType: "admin" | "customer" | "instructor",
  expirationTime: string = "1h",
): Promise<string> {
  const { SignJWT } = await import("jose");
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }

  const token = await new SignJWT({
    id: userId.toString(),
    userType,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .sign(new TextEncoder().encode(secret));

  return token;
}

/**
 * Generate cookie header for authenticated requests
 */
export async function generateAuthCookie(
  userId: number,
  userType: "admin" | "customer" | "instructor",
  options?: { expirationTime?: string },
): Promise<string> {
  const salt = process.env.AUTH_SALT || "authjs.session-token";
  const token = await generateAuthToken(
    userId,
    userType,
    options?.expirationTime ?? "1h",
  );
  return `${salt}=${token}`;
}
