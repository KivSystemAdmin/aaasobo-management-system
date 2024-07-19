/*
  Warnings:

  - A unique constraint covering the columns `[class_link]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[icon]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nick_name]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `class_link` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nick_name` to the `Instructor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "class_link" TEXT NOT NULL,
ADD COLUMN     "icon" TEXT NOT NULL,
ADD COLUMN     "nick_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_class_link_key" ON "Instructor"("class_link");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_icon_key" ON "Instructor"("icon");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_nick_name_key" ON "Instructor"("nick_name");
