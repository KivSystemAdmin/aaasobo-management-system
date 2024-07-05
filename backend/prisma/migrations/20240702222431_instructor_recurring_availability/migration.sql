-- AlterTable
ALTER TABLE "InstructorAvailability" ADD COLUMN     "instructorRecurringAvailabilityId" INTEGER;

-- CreateTable
CREATE TABLE "InstructorRecurringAvailability" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "rrule" TEXT NOT NULL,

    CONSTRAINT "InstructorRecurringAvailability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InstructorRecurringAvailability" ADD CONSTRAINT "InstructorRecurringAvailability_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorAvailability" ADD CONSTRAINT "InstructorAvailability_instructorRecurringAvailabilityId_fkey" FOREIGN KEY ("instructorRecurringAvailabilityId") REFERENCES "InstructorRecurringAvailability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
