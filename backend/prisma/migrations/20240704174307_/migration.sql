-- CreateTable
CREATE TABLE "Children" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonAttendance" (
    "lessonId" INTEGER NOT NULL,
    "childrenId" INTEGER NOT NULL,

    CONSTRAINT "LessonAttendance_pkey" PRIMARY KEY ("lessonId","childrenId")
);

-- AddForeignKey
ALTER TABLE "Children" ADD CONSTRAINT "Children_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAttendance" ADD CONSTRAINT "LessonAttendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAttendance" ADD CONSTRAINT "LessonAttendance_childrenId_fkey" FOREIGN KEY ("childrenId") REFERENCES "Children"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
