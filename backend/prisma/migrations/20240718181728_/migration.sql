/*
  Warnings:

  - You are about to drop the column `tokens` on the `Plan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "tokens",
ALTER COLUMN "description" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RecurringClass" ALTER COLUMN "subscriptionId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "RecurringClass" ADD CONSTRAINT "RecurringClass_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
