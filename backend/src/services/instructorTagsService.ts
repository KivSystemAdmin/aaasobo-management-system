import { prisma } from "../../prisma/prismaClient";

export type InstructorTag = {
  id: number;
  label: string;
  sortOrder: number;
};

export const getTagCatalog = async () => {
  return prisma.$queryRaw<InstructorTag[]>`
    SELECT id, label, "sortOrder"
    FROM "InstructorTagCatalog"
    WHERE "deletedAt" IS NULL
    ORDER BY "sortOrder" ASC, id ASC
  `;
};

export const addTagToCatalog = async (label: string, adminId: number) => {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error("Tag label is required.");
  }

  const duplicate = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id
    FROM "InstructorTagCatalog"
    WHERE lower(label) = lower(${trimmed})
      AND "deletedAt" IS NULL
    LIMIT 1
  `;

  if (duplicate.length > 0) {
    throw new Error("Tag label already exists.");
  }

  const [maxSort] = await prisma.$queryRaw<{ maxSortOrder: number | null }[]>`
    SELECT MAX("sortOrder") AS "maxSortOrder"
    FROM "InstructorTagCatalog"
  `;

  const nextSortOrder = (maxSort?.maxSortOrder ?? 0) + 1;

  const created = await prisma.$queryRaw<InstructorTag[]>`
    INSERT INTO "InstructorTagCatalog" (label, "sortOrder", "createdBy")
    VALUES (${trimmed}, ${nextSortOrder}, ${adminId})
    RETURNING id, label, "sortOrder"
  `;

  return created[0];
};

export const softDeleteTag = async (tagId: number, adminId: number) => {
  await prisma.$executeRaw`
    UPDATE "InstructorTagCatalog"
    SET "deletedAt" = NOW(), "deletedBy" = ${adminId}
    WHERE id = ${tagId}
      AND "deletedAt" IS NULL
  `;

  await prisma.$executeRaw`
    DELETE FROM "InstructorTagAssignment"
    WHERE "tagId" = ${tagId}
  `;
};

export const getInstructorTagIds = async (instructorId: number) => {
  const rows = await prisma.$queryRaw<{ tagId: number }[]>`
    SELECT ita."tagId"
    FROM "InstructorTagAssignment" ita
    INNER JOIN "InstructorTagCatalog" itc
      ON itc.id = ita."tagId"
     AND itc."deletedAt" IS NULL
    WHERE ita."instructorId" = ${instructorId}
  `;

  return rows.map((row) => row.tagId);
};

export const updateInstructorTags = async (
  instructorId: number,
  tagIds: number[],
  updatedBy: number,
) => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM "InstructorTagAssignment"
      WHERE "instructorId" = ${instructorId}
    `;

    if (tagIds.length === 0) {
      return;
    }

    await Promise.all(
      tagIds.map(
        (tagId) =>
          tx.$executeRaw`
          INSERT INTO "InstructorTagAssignment" ("instructorId", "tagId", "updatedBy")
          SELECT ${instructorId}, id, ${updatedBy}
          FROM "InstructorTagCatalog"
          WHERE id = ${tagId}
            AND "deletedAt" IS NULL
          ON CONFLICT ("instructorId", "tagId") DO NOTHING
        `,
      ),
    );
  });
};

export const getTagUsageCounts = async () => {
  return prisma.$queryRaw<
    { id: number; label: string; sortOrder: number; assignedCount: number }[]
  >`
    SELECT
      itc.id,
      itc.label,
      itc."sortOrder",
      COUNT(ita."instructorId")::int AS "assignedCount"
    FROM "InstructorTagCatalog" itc
    LEFT JOIN "InstructorTagAssignment" ita
      ON ita."tagId" = itc.id
    WHERE itc."deletedAt" IS NULL
    GROUP BY itc.id, itc.label, itc."sortOrder"
    ORDER BY itc."sortOrder" ASC, itc.id ASC
  `;
};

export const getTagsByInstructorIds = async (instructorIds: number[]) => {
  if (instructorIds.length === 0) {
    return [] as {
      instructorId: number;
      id: number;
      label: string;
      sortOrder: number;
    }[];
  }

  const rows = await Promise.all(
    instructorIds.map(
      (instructorId) =>
        prisma.$queryRaw<
          {
            instructorId: number;
            id: number;
            label: string;
            sortOrder: number;
          }[]
        >`
        SELECT
          ita."instructorId",
          itc.id,
          itc.label,
          itc."sortOrder"
        FROM "InstructorTagAssignment" ita
        INNER JOIN "InstructorTagCatalog" itc
          ON itc.id = ita."tagId"
         AND itc."deletedAt" IS NULL
        WHERE ita."instructorId" = ${instructorId}
        ORDER BY itc."sortOrder" ASC, itc.id ASC
      `,
    ),
  );

  return rows.flat();
};
