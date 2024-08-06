/*
  Warnings:

  - Added the required column `weeklyClassTimes` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RecurringClass" DROP CONSTRAINT "RecurringClass_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "RecurringClass" DROP CONSTRAINT "RecurringClass_subscriptionId_fkey";

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "weeklyClassTimes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RecurringClass" ALTER COLUMN "instructorId" DROP NOT NULL,
ALTER COLUMN "subscriptionId" DROP NOT NULL,
ALTER COLUMN "startAt" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RecurringClass" ADD CONSTRAINT "RecurringClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClass" ADD CONSTRAINT "RecurringClass_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
