-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "isAdmin" BOOLEAN NOT NULL,
    "isCustomer" BOOLEAN NOT NULL,
    "isInstructor" BOOLEAN NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);
