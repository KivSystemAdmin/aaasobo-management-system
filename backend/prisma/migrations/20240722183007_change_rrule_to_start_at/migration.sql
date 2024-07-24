/*
  Warnings:

  - You are about to drop the column `rrule` on the `RecurringClass` table. All the data in the column will be lost.
  - Added the required column `startAt` to the `RecurringClass` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RecurringClass" DROP COLUMN "rrule",
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL;
