import { prisma } from "../../prisma/prismaClient";

// Fetch duplicate count of the admin using the email
export const getAdminDuplicateCount = async (email: string) => {
  try {
    return await prisma.admins.count({
      where: { email },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch admin duplicate count.");
  }
};

// Create a new admin in the DB
export const createAdmin = async (adminData: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    return await prisma.admins.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add admin.");
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
