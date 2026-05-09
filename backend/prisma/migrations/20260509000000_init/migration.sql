-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('booked', 'completed', 'canceledByCustomer', 'canceledByInstructor', 'pending', 'rebooked', 'declined');

-- CreateTable
CREATE TABLE "Instructor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "classURL" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "passcode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "favoriteFood" TEXT NOT NULL,
    "hobby" TEXT NOT NULL,
    "lifeHistory" TEXT NOT NULL,
    "messageForChildren" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "workingTime" TEXT NOT NULL,
    "terminationAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "englishBackground" INTEGER NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorTagCatalog" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,

    CONSTRAINT "InstructorTagCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorTagAssignment" (
    "instructorId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructorTagAssignment_pkey" PRIMARY KEY ("instructorId","tagId")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasSeenWelcome" BOOLEAN NOT NULL DEFAULT false,
    "terminationAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER,
    "customerId" INTEGER NOT NULL,
    "recurringClassId" INTEGER,
    "dateTime" TIMESTAMP(3),
    "status" "Status" NOT NULL,
    "canceledAt" TIMESTAMP(3),
    "subscriptionId" INTEGER,
    "rebookableUntil" TIMESTAMP(3),
    "classCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFreeTrial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassAttendance" (
    "classId" INTEGER NOT NULL,
    "childrenId" INTEGER NOT NULL,

    CONSTRAINT "ClassAttendance_pkey" PRIMARY KEY ("classId","childrenId")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weeklyClassTimes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminationAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "englishBackground" INTEGER NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "selectType" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringClass" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER,
    "subscriptionId" INTEGER,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),

    CONSTRAINT "RecurringClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringClassAttendance" (
    "recurringClassId" INTEGER NOT NULL,
    "childrenId" INTEGER NOT NULL,

    CONSTRAINT "RecurringClassAttendance_pkey" PRIMARY KEY ("recurringClassId","childrenId")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "eventId" INTEGER NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorSchedule" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "InstructorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorSlot" (
    "scheduleId" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TIME(6) NOT NULL,

    CONSTRAINT "InstructorSlot_pkey" PRIMARY KEY ("scheduleId","weekday","startTime")
);

-- CreateTable
CREATE TABLE "InstructorAbsence" (
    "instructorId" INTEGER NOT NULL,
    "absentAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorAbsence_pkey" PRIMARY KEY ("instructorId","absentAt")
);

-- CreateTable
CREATE TABLE "InstructorFee" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "trialFee" INTEGER NOT NULL,
    "regularFee" INTEGER NOT NULL,
    "cancelFee" INTEGER NOT NULL,
    "cancelWithoutNoticeFee" INTEGER NOT NULL,
    "monthlyCancelFee" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InstructorFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemStatus" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Running',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "terminationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3),
    "personalInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageBoardPost" (
    "id" SERIAL NOT NULL,
    "target" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageBoardPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_classURL_key" ON "Instructor"("classURL");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_icon_key" ON "Instructor"("icon");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_nickname_key" ON "Instructor"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_meetingId_key" ON "Instructor"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_passcode_key" ON "Instructor"("passcode");

-- CreateIndex
CREATE INDEX "Instructor_terminationAt_idx" ON "Instructor"("terminationAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorTagCatalog_label_key" ON "InstructorTagCatalog"("label");

-- CreateIndex
CREATE INDEX "InstructorTagCatalog_deletedAt_idx" ON "InstructorTagCatalog"("deletedAt");

-- CreateIndex
CREATE INDEX "InstructorTagCatalog_sortOrder_idx" ON "InstructorTagCatalog"("sortOrder");

-- CreateIndex
CREATE INDEX "InstructorTagAssignment_tagId_idx" ON "InstructorTagAssignment"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_terminationAt_idx" ON "Customer"("terminationAt");

-- CreateIndex
CREATE INDEX "Class_status_idx" ON "Class"("status");

-- CreateIndex
CREATE INDEX "Class_dateTime_idx" ON "Class"("dateTime");

-- CreateIndex
CREATE INDEX "Class_customerId_idx" ON "Class"("customerId");

-- CreateIndex
CREATE INDEX "Class_instructorId_idx" ON "Class"("instructorId");

-- CreateIndex
CREATE INDEX "Class_status_dateTime_idx" ON "Class"("status", "dateTime");

-- CreateIndex
CREATE INDEX "Class_customerId_dateTime_idx" ON "Class"("customerId", "dateTime");

-- CreateIndex
CREATE INDEX "Class_instructorId_dateTime_idx" ON "Class"("instructorId", "dateTime");

-- CreateIndex
CREATE INDEX "Class_customerId_status_dateTime_idx" ON "Class"("customerId", "status", "dateTime");

-- CreateIndex
CREATE INDEX "Class_instructorId_status_dateTime_idx" ON "Class"("instructorId", "status", "dateTime");

-- CreateIndex
CREATE INDEX "Class_recurringClassId_dateTime_idx" ON "Class"("recurringClassId", "dateTime");

-- CreateIndex
CREATE INDEX "Class_subscriptionId_idx" ON "Class"("subscriptionId");

-- CreateIndex
CREATE INDEX "Class_rebookableUntil_idx" ON "Class"("rebookableUntil");

-- CreateIndex
CREATE INDEX "Class_canceledAt_idx" ON "Class"("canceledAt");

-- Prevent instructor double booking for active classes.
-- Note: Prisma schema cannot express partial unique indexes, so this is raw SQL.
CREATE UNIQUE INDEX "Class_instructorId_dateTime_unique_active"
ON "Class" ("instructorId", "dateTime")
WHERE
  "instructorId" IS NOT NULL
  AND "dateTime" IS NOT NULL
  AND "status" IN ('booked', 'rebooked');

-- CreateIndex
CREATE INDEX "ClassAttendance_childrenId_idx" ON "ClassAttendance"("childrenId");

-- CreateIndex
CREATE INDEX "Plan_terminationAt_idx" ON "Plan"("terminationAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_selectType_key" ON "Subscription"("selectType");

-- CreateIndex
CREATE INDEX "Subscription_customerId_idx" ON "Subscription"("customerId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_customerId_planId_idx" ON "Subscription"("customerId", "planId");

-- CreateIndex
CREATE INDEX "RecurringClass_instructorId_endAt_idx" ON "RecurringClass"("instructorId", "endAt");

-- CreateIndex
CREATE INDEX "RecurringClass_subscriptionId_endAt_idx" ON "RecurringClass"("subscriptionId", "endAt");

-- CreateIndex
CREATE INDEX "RecurringClass_endAt_idx" ON "RecurringClass"("endAt");

-- CreateIndex
CREATE INDEX "RecurringClassAttendance_childrenId_idx" ON "RecurringClassAttendance"("childrenId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_email_idx" ON "VerificationToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_email_token_key" ON "VerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_date_key" ON "Schedule"("date");

-- CreateIndex
CREATE INDEX "Schedule_eventId_idx" ON "Schedule"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_name_key" ON "Event"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Event_color_key" ON "Event"("color");

-- CreateIndex
CREATE INDEX "InstructorSchedule_instructorId_effectiveFrom_idx" ON "InstructorSchedule"("instructorId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "InstructorSchedule_instructorId_timezone_effectiveFrom_idx" ON "InstructorSchedule"("instructorId", "timezone", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorSchedule_instructorId_effectiveTo_key" ON "InstructorSchedule"("instructorId", "effectiveTo");

-- CreateIndex
CREATE INDEX "InstructorSlot_weekday_startTime_idx" ON "InstructorSlot"("weekday", "startTime");

-- CreateIndex
CREATE INDEX "InstructorAbsence_absentAt_idx" ON "InstructorAbsence"("absentAt");

-- CreateIndex
CREATE INDEX "InstructorFee_instructorId_effectiveFrom_idx" ON "InstructorFee"("instructorId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "InstructorFee_instructorId_effectiveTo_idx" ON "InstructorFee"("instructorId", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_terminationAt_idx" ON "Admin"("terminationAt");

-- CreateIndex
CREATE INDEX "Child_customerId_idx" ON "Child"("customerId");

-- CreateIndex
CREATE INDEX "MessageBoardPost_target_idx" ON "MessageBoardPost"("target");

-- CreateIndex
CREATE INDEX "MessageBoardPost_createdAt_idx" ON "MessageBoardPost"("createdAt");

-- AddForeignKey
ALTER TABLE "InstructorTagAssignment" ADD CONSTRAINT "InstructorTagAssignment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorTagAssignment" ADD CONSTRAINT "InstructorTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "InstructorTagCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_recurringClassId_fkey" FOREIGN KEY ("recurringClassId") REFERENCES "RecurringClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_childrenId_fkey" FOREIGN KEY ("childrenId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClass" ADD CONSTRAINT "RecurringClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClass" ADD CONSTRAINT "RecurringClass_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClassAttendance" ADD CONSTRAINT "RecurringClassAttendance_childrenId_fkey" FOREIGN KEY ("childrenId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClassAttendance" ADD CONSTRAINT "RecurringClassAttendance_recurringClassId_fkey" FOREIGN KEY ("recurringClassId") REFERENCES "RecurringClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorSchedule" ADD CONSTRAINT "InstructorSchedule_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorSlot" ADD CONSTRAINT "InstructorSlot_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "InstructorSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorAbsence" ADD CONSTRAINT "InstructorAbsence_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorFee" ADD CONSTRAINT "InstructorFee_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
