-- CreateTable
CREATE TABLE "InstructorTagCatalog" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,

    CONSTRAINT "InstructorTagCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorTagAssignment" (
    "instructorId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructorTagAssignment_pkey" PRIMARY KEY ("instructorId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstructorTagCatalog_label_key" ON "InstructorTagCatalog"("label");
CREATE INDEX "InstructorTagCatalog_deletedAt_idx" ON "InstructorTagCatalog"("deletedAt");
CREATE INDEX "InstructorTagCatalog_sortOrder_idx" ON "InstructorTagCatalog"("sortOrder");
CREATE INDEX "InstructorTagAssignment_tagId_idx" ON "InstructorTagAssignment"("tagId");

-- AddForeignKey
ALTER TABLE "InstructorTagAssignment" ADD CONSTRAINT "InstructorTagAssignment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstructorTagAssignment" ADD CONSTRAINT "InstructorTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "InstructorTagCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
