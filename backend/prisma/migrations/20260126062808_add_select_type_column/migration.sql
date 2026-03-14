/*
  Warnings:

  - A unique constraint covering the columns `[selectType]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `selectType` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "selectType" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_selectType_key" ON "Subscription"("selectType");
