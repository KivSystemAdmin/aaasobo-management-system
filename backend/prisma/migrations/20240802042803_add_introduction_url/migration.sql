/*
  Warnings:

  - A unique constraint covering the columns `[introductionURL]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `introductionURL` to the `Instructor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "introductionURL" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_introductionURL_key" ON "Instructor"("introductionURL");
