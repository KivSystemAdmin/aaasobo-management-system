/*
  Warnings:

  - You are about to drop the column `isNative` on the `Instructor` table. All the data in the column will be lost.
  - Added the required column `englishBackground` to the `Instructor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "isNative",
ADD COLUMN     "englishBackground" INTEGER NOT NULL;
