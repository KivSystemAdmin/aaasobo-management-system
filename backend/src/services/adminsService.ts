import { prisma } from "../../prisma/prismaClient";
import { Admin } from "../../generated/prisma";
import { hashPassword } from "../utils/commonUtils";

// Register a new admin in the DB
export const registerAdmin = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const hashedPassword = await hashPassword(data.password);

  await prisma.admin.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  return;
};

// Update the selected admin
export const updateAdmin = async (id: number, name: string, email: string) => {
  try {
    // Update the admin data.
    const admin = await prisma.admin.update({
      where: {
        id,
      },
      data: {
        name,
        email,
      },
    });
    return admin;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the admin data.");
  }
};

// Update the admin password
export const updateAdminPassword = async (id: number, newPassword: string) => {
  return await prisma.admin.update({
    where: { id },
    data: { password: newPassword },
  });
};

// Delete the selected admin
export const deleteAdmin = async (adminId: number) => {
  try {
    // Delete the Admin data.
    const admin = await prisma.admin.delete({
      where: { id: adminId },
    });

    return admin;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete a admin.");
  }
};

// Fetch all admins information
export const getAllAdmins = async () => {
  try {
    return await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch admins.");
  }
};

// Fetch the admin using the email
export const getAdminByEmail = async (email: string): Promise<Admin | null> => {
  return await prisma.admin.findUnique({
    where: { email },
  });
};

export const getAdminAuthByEmail = async (email: string) => {
  return await prisma.admin.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      password: true,
    },
  });
};

// Fetch the admin using the ID
export async function getAdminById(id: number) {
  try {
    return prisma.admin.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch admin.");
  }
}
