-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "recurringClassId" INTEGER;

-- CreateTable
CREATE TABLE "RecurringClass" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "rrule" TEXT NOT NULL,

    CONSTRAINT "RecurringClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringClassAttendance" (
    "recurringClassId" INTEGER NOT NULL,
    "childrenId" INTEGER NOT NULL,

    CONSTRAINT "RecurringClassAttendance_pkey" PRIMARY KEY ("recurringClassId","childrenId")
);

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_recurringClassId_fkey" FOREIGN KEY ("recurringClassId") REFERENCES "RecurringClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClass" ADD CONSTRAINT "RecurringClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClassAttendance" ADD CONSTRAINT "RecurringClassAttendance_recurringClassId_fkey" FOREIGN KEY ("recurringClassId") REFERENCES "RecurringClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClassAttendance" ADD CONSTRAINT "RecurringClassAttendance_childrenId_fkey" FOREIGN KEY ("childrenId") REFERENCES "Children"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
