-- CreateTable
CREATE TABLE "MessageBoardPost" (
    "id" SERIAL NOT NULL,
    "target" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageBoardPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageBoardPost_target_idx" ON "MessageBoardPost"("target");

-- CreateIndex
CREATE INDEX "MessageBoardPost_createdAt_idx" ON "MessageBoardPost"("createdAt");
