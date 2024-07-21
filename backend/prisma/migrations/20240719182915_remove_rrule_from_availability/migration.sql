/*
  Warnings:

  - You are about to drop the column `rrule` on the `InstructorRecurringAvailability` table. All the data in the column will be lost.
  - Made the column `instructorRecurringAvailabilityId` on table `InstructorAvailability` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `startAt` to the `InstructorRecurringAvailability` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "InstructorAvailability" DROP CONSTRAINT "InstructorAvailability_instructorRecurringAvailabilityId_fkey";

-- AlterTable
ALTER TABLE "InstructorAvailability" ALTER COLUMN "instructorRecurringAvailabilityId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InstructorRecurringAvailability" DROP COLUMN "rrule",
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "InstructorAvailability" ADD CONSTRAINT "InstructorAvailability_instructorRecurringAvailabilityId_fkey" FOREIGN KEY ("instructorRecurringAvailabilityId") REFERENCES "InstructorRecurringAvailability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
