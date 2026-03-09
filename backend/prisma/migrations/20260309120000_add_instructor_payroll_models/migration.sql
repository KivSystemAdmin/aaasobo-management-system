-- AlterTable
ALTER TABLE "Class" ADD COLUMN "canceledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InstructorFee" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "trialFee" INTEGER NOT NULL,
    "regularFee" INTEGER NOT NULL,
    "cancelFee" INTEGER NOT NULL,
    "cancelWithoutNoticeFee" INTEGER NOT NULL,

    CONSTRAINT "InstructorFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Class_canceledAt_idx" ON "Class"("canceledAt");

-- AddForeignKey
ALTER TABLE "InstructorFee" ADD CONSTRAINT "InstructorFee_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
