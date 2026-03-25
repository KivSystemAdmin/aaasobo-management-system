import { prisma } from "../../prisma/prismaClient";

export const getTagCatalog = async () => {
  return prisma.instructorTagCatalog.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      label: true,
      sortOrder: true,
    },
  });
};

export const addTagToCatalog = async (label: string, adminId: number) => {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error("Tag label is required.");
  }

  const existing = await prisma.instructorTagCatalog.findFirst({
    where: {
      label: {
        equals: trimmed,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      deletedAt: true,
    },
  });

  if (existing && existing.deletedAt === null) {
    throw new Error("Tag label already exists.");
  }

  const maxSort = await prisma.instructorTagCatalog.aggregate({
    _max: { sortOrder: true },
  });
  const nextSortOrder = (maxSort._max.sortOrder ?? 0) + 1;

  if (existing) {
    return prisma.instructorTagCatalog.update({
      where: { id: existing.id },
      data: {
        label: trimmed,
        sortOrder: nextSortOrder,
        deletedAt: null,
        deletedBy: null,
      },
      select: {
        id: true,
        label: true,
        sortOrder: true,
      },
    });
  }

  return prisma.instructorTagCatalog.create({
    data: {
      label: trimmed,
      sortOrder: nextSortOrder,
      createdBy: adminId,
    },
    select: {
      id: true,
      label: true,
      sortOrder: true,
    },
  });
};

export const softDeleteTag = async (tagId: number, adminId: number) => {
  await prisma.$transaction([
    prisma.instructorTagCatalog.updateMany({
      where: { id: tagId, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy: adminId },
    }),
    prisma.instructorTagAssignment.deleteMany({
      where: { tagId },
    }),
  ]);
};

export const getInstructorTagIds = async (instructorId: number) => {
  const rows = await prisma.instructorTagAssignment.findMany({
    where: {
      instructorId,
      tag: {
        deletedAt: null,
      },
    },
    select: { tagId: true },
  });

  return rows.map((row) => row.tagId);
};

export const updateInstructorTags = async (
  instructorId: number,
  tagIds: number[],
  updatedBy: number,
) => {
  await prisma.$transaction(async (tx) => {
    await tx.instructorTagAssignment.deleteMany({
      where: { instructorId },
    });

    if (tagIds.length === 0) {
      return;
    }

    const validTags = await tx.instructorTagCatalog.findMany({
      where: {
        id: { in: tagIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (validTags.length === 0) {
      return;
    }

    await tx.instructorTagAssignment.createMany({
      data: validTags.map(({ id }) => ({
        instructorId,
        tagId: id,
        updatedBy,
      })),
      skipDuplicates: true,
    });
  });
};

export const getTagUsageCounts = async () => {
  const rows = await prisma.instructorTagCatalog.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      label: true,
      sortOrder: true,
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    sortOrder: row.sortOrder,
    assignedCount: row._count.assignments,
  }));
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

  const rows = await prisma.instructorTagAssignment.findMany({
    where: {
      instructorId: { in: instructorIds },
      tag: { deletedAt: null },
    },
    orderBy: [
      { instructorId: "asc" },
      { tag: { sortOrder: "asc" } },
      { tagId: "asc" },
    ],
    select: {
      instructorId: true,
      tag: {
        select: {
          id: true,
          label: true,
          sortOrder: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    instructorId: row.instructorId,
    id: row.tag.id,
    label: row.tag.label,
    sortOrder: row.tag.sortOrder,
  }));
};
