/*
  Warnings:

  - You are about to drop the column `class_link` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `nick_name` on the `Instructor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classLink]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nickname]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classLink` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nickname` to the `Instructor` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Instructor_class_link_key";

-- DropIndex
DROP INDEX "Instructor_nick_name_key";

-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "class_link",
DROP COLUMN "nick_name",
ADD COLUMN     "classLink" TEXT NOT NULL,
ADD COLUMN     "nickname" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_classLink_key" ON "Instructor"("classLink");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_nickname_key" ON "Instructor"("nickname");
