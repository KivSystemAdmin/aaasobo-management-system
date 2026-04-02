-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "terminationAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MessageBoardPost" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
