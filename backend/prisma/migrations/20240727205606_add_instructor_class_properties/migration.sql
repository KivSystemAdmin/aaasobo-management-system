/*
  Warnings:

  - The values [canceled] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `classLink` on the `Instructor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classURL]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[meetingId]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passcode]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classURL` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meetingId` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passcode` to the `Instructor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('booked', 'completed', 'canceledByCustomer', 'canceledByInstructor');
ALTER TABLE "Class" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
COMMIT;

-- DropIndex
DROP INDEX "Instructor_classLink_key";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "isRebookable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "classLink",
ADD COLUMN     "classURL" TEXT NOT NULL,
ADD COLUMN     "meetingId" TEXT NOT NULL,
ADD COLUMN     "passcode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_classURL_key" ON "Instructor"("classURL");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_meetingId_key" ON "Instructor"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_passcode_key" ON "Instructor"("passcode");
