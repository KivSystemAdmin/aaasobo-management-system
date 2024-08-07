import { Customer } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const fetchCustomerById = async (
  customerId: number,
): Promise<Customer | null> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error("Customer not found.");
    }

    return customer;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch customer.");
  }
};

export const updateCustomer = async (
  id: number,
  name: string,
  email: string,
  prefecture: string,
) => {
  try {
    // Update the Customer data.
    const customer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        prefecture,
      },
    });

    return customer;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the customer data.");
  }
};

// Fetch all customers information
export const getAllCustomers = async () => {
  try {
    return await prisma.customer.findMany();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch customers.");
  }
};
