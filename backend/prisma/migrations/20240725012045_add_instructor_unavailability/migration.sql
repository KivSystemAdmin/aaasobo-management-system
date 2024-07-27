-- CreateTable
CREATE TABLE "InstructorUnavailability" (
    "instructorId" INTEGER NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorUnavailability_pkey" PRIMARY KEY ("instructorId","dateTime")
);

-- AddForeignKey
ALTER TABLE "InstructorUnavailability" ADD CONSTRAINT "InstructorUnavailability_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
