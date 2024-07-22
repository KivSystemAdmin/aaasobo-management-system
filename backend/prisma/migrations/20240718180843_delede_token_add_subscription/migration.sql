/*
  Warnings:

  - You are about to drop the column `tokens` on the `Plan` table. All the data in the column will be lost.
  - Added the required column `description` to the `Plan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionId` to the `RecurringClass` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add columns with a default value
ALTER TABLE "Plan" ADD COLUMN "description" TEXT DEFAULT 'Default description';
ALTER TABLE "RecurringClass" ADD COLUMN "subscriptionId" INTEGER DEFAULT 0;

-- Step 2: Update the existing rows to have meaningful values
-- Note: Update these queries with actual meaningful values as needed
UPDATE "Plan" SET "description" = 'Actual description' WHERE "description" = 'Default description';
UPDATE "RecurringClass" SET "subscriptionId" = 1 WHERE "subscriptionId" = 0;

-- Step 3: Make the columns required
ALTER TABLE "Plan" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "RecurringClass" ALTER COLUMN "subscriptionId" SET NOT NULL;