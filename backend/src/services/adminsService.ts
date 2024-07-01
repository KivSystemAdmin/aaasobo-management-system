import { prisma } from "../../prisma/prismaClient";
import { Prisma } from "@prisma/client";

// Create a new admin in the DB
export const createAdmin = async (adminData: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    return await prisma.admins.create({
      data: adminData,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique Constraint Violation
      if (error.code === "P2002") {
        throw new Error("Email is already registered");
      } else {
        console.error("Database Error:", error);
        throw new Error("Failed to register admin");
      }
    }
  }
};

// Fetch the admin using the email
export const getAdmin = async (email: string) => {
  try {
    return await prisma.admins.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch admin.");
  }
};
