import { Customer, Prisma } from "../../generated/prisma";
import { prisma } from "../../prisma/prismaClient";
import {
  hashPassword,
  maskedHeadLetters,
  maskedSuffix,
  maskedBirthdate,
  MONTHS_TO_DELETE_CUSTOMERS,
} from "../utils/commonUtils";

export const getCustomerById = async (customerId: number) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    return null;
  }

  const { password, ...customerWithoutPassword } = customer;
  return customerWithoutPassword;
};

export const updateCustomerProfile = async (
  id: number,
  dataToUpdate: {
    name?: string;
    email?: string;
    prefecture?: string;
    emailVerified?: Date | null;
    hasSeenWelcome?: boolean;
  },
) => {
  await prisma.customer.update({
    where: {
      id,
    },
    data: dataToUpdate,
  });
};

// Deactivate (soft delete) a customer and their children by masking their profile
export const deactivateCustomer = async (id: number) => {
  const suffix = maskedSuffix;
  const maskedLetters = `${maskedHeadLetters}_${suffix}`;
  const maskedEmailLetters = `${maskedHeadLetters}@${suffix}${id}.xxx`;

  // Use a transaction to ensure both customer and children are updated atomically
  const deactivatedUsers = await prisma.$transaction(async (tx) => {
    // Fetch the applicable children ids and names
    const children = await tx.child.findMany({
      where: { customerId: id },
      select: { name: true, id: true },
    });

    const updatedChildrenNames = children.map((child) => ({
      id: child.id,
      name: child.name,
    }));

    // Mask the customer information
    const deactivatedCustomer = await tx.customer.update({
      where: {
        id,
      },
      data: {
        email: maskedEmailLetters,
        password: maskedLetters + id,
        prefecture: maskedHeadLetters,
        terminationAt: new Date(),
      },
    });

    // If there are no children, return early
    if (children.length === 0) {
      return { customer: deactivatedCustomer, children: [] };
    }

    // Mask the children information
    const deactivatedChildren = await Promise.all(
      updatedChildrenNames.map((child) =>
        tx.child.update({
          where: { id: child.id },
          data: {
            birthdate: maskedBirthdate,
            personalInfo: maskedHeadLetters,
          },
        }),
      ),
    );

    return { customer: deactivatedCustomer, children: deactivatedChildren };
  });

  return deactivatedUsers;
};

// Fetch all customers information
export const getAllCustomers = async () => {
  try {
    return await prisma.customer.findMany({
      where: { terminationAt: null }, // Active customers only
      select: {
        id: true,
        name: true,
        email: true,
        prefecture: true,
        children: {
          select: { name: true },
        },
      },
      orderBy: {
        id: "asc",
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch customers.");
  }
};

// Fetch all past customers information
export const getAllPastCustomers = async () => {
  try {
    return await prisma.customer.findMany({
      where: { terminationAt: { not: null } }, // Past customers only
      select: {
        id: true,
        name: true,
        children: {
          select: { name: true },
        },
        terminationAt: true,
      },
      orderBy: {
        terminationAt: "asc",
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch past customers.");
  }
};

export const getCustomerByEmail = async (
  email: string,
): Promise<Customer | null> => {
  return await prisma.customer.findUnique({
    where: { email },
  });
};

export const getCustomerAuthByEmail = async (email: string) => {
  return await prisma.customer.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      password: true,
      emailVerified: true,
    },
  });
};

export const registerCustomer = async (
  data: {
    name: string;
    email: string;
    password: string;
    prefecture: string;
  },
  tx?: Prisma.TransactionClient,
) => {
  const db = tx ?? prisma;
  const hashedPassword = await hashPassword(data.password);

  const customer = await db.customer.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      prefecture: data.prefecture,
    },
  });

  return {
    id: customer.id,
    name: customer.name,
  };
};

export const verifyCustomerEmail = async (
  id: number,
  email: string,
): Promise<void> => {
  await prisma.customer.update({
    where: {
      id,
    },
    data: {
      emailVerified: new Date(),
      email,
    },
  });
};

export const updateCustomerPassword = async (
  id: number,
  newPassword: string,
) => {
  return await prisma.customer.update({
    where: { id },
    data: { password: newPassword },
  });
};

export const deleteCustomer = async (
  id: number,
  tx?: Prisma.TransactionClient,
) => {
  const db = tx ?? prisma;
  await db.customer.delete({
    where: {
      id,
    },
  });
};

export const getCustomerContactById = async (id: number) => {
  return prisma.customer.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
    },
  });
};

// Delete customers who have left the service more than 3 years ago
export const deletePastCustomers = async () => {
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - MONTHS_TO_DELETE_CUSTOMERS);

  return await prisma.customer.deleteMany({
    where: {
      terminationAt: {
        lt: thresholdDate,
      },
    },
  });
};
