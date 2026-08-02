import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const getChildren = async (customerId: string) => {
  // Fetch the Children data from the DB
  try {
    const children = await prisma.child.findMany({
      where: { customerId: parseInt(customerId) },
      include: { customer: true },
      orderBy: { id: "asc" },
    });

    return children;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch children.");
  }
};

export const registerChild = async (
  name: string,
  birthdate: string,
  personalInfo: string,
  customerId: number,
  tx?: Prisma.TransactionClient,
) => {
  const db = tx ?? prisma;

  const child = await db.child.create({
    data: {
      name,
      birthdate,
      personalInfo,
      customerId,
    },
  });

  return child;
};

export const updateChildProfile = async (
  childId: number,
  dataToUpdate: {
    name: string;
    birthdate: string;
    personalInfo: string;
    customerId: number;
  },
) => {
  const child = await prisma.child.update({
    where: {
      id: childId,
    },
    data: dataToUpdate,
  });

  return child;
};

export const deleteChild = async (
  tx: Prisma.TransactionClient,
  childId: number,
) => {
  const child = await tx.child.delete({
    where: { id: childId },
  });

  return child;
};

export const getChildById = async (id: number) => {
  const child = await prisma.child.findUnique({
    where: { id },
  });

  return child;
};

export const getAllChildren = async () => {
  // Fetch the Children data from the DB
  try {
    const children = await prisma.child.findMany({
      include: { customer: true },
      orderBy: { id: "asc" },
    });

    return children;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch all children.");
  }
};

export const getChildProfiles = async (customerId: number) => {
  const children = await prisma.child.findMany({
    where: { customerId },
    orderBy: { id: "asc" },
  });
  const childProfiles = children.map((child) => ({
    id: child.id,
    name: child.name,
    birthdate: child.birthdate,
    personalInfo: child.personalInfo,
  }));

  return childProfiles;
};

export const getChildrenNamesByIds = async (
  childrenIds: number[],
): Promise<string> => {
  const children = await prisma.child.findMany({
    where: {
      id: {
        in: childrenIds,
      },
    },
    select: {
      name: true,
    },
  });

  return children.map((child) => child.name).join(", ");
};
