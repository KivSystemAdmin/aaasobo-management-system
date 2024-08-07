import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const getChildren = async (customerId: string) => {
  // Fetch the Children data from the DB
  try {
    const children = await prisma.children.findMany({
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

export const registerChild = async (name: string, customerId: number) => {
  try {
    // Insert the Child data into the DB.
    const child = await prisma.children.create({
      data: {
        name,
        customerId,
      },
    });

    return child;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add a child.");
  }
};

export const updateChild = async (
  id: number,
  name: string,
  customerId: number,
) => {
  try {
    // Update the Child data.
    const child = await prisma.children.update({
      where: {
        id,
      },
      data: {
        name,
        customerId,
      },
    });

    return child;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update a child.");
  }
};

export const deleteChild = async (
  tx: Prisma.TransactionClient,
  childId: number,
) => {
  try {
    // Delete the Child data.
    const child = await tx.children.delete({
      where: { id: childId },
    });

    return child;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete a child.");
  }
};

export const getChildById = async (id: number) => {
  try {
    const child = await prisma.children.findUnique({
      where: { id },
    });

    return child;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch child.");
  }
};

export const getAllChildren = async () => {
  // Fetch the Children data from the DB
  try {
    const children = await prisma.children.findMany({
      include: { customer: true },
      orderBy: { id: "asc" },
    });

    return children;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch all children.");
  }
};
