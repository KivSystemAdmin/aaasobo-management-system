import { Request, Response } from "express";
import { prisma } from "../../prisma/prismaClient";

export const registerCustomer = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // TODO: Validate an email and the password.
  // TODO: Hash the password.

  try {
    // Insert the customer data into the DB.
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        password,
      },
    });

    // Exclude the password from the response.
    const { password: _, ...customerWithoutPassword } = customer;

    res.status(200).json({
      redirectUrl: "/login",
      message: "Customer is registered successfully",
      customer: customerWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // TODO: Check if the password is correct or not.

    // Exclude the password from the response.
    const { password: _, ...customerWithoutPassword } = customer;

    res.status(200).json({
      redirectUrl: `/customers/${customer.id}/dashboard/home`,
      message: "Customer logged in successfully",
      customer: customerWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getCustomersClasses = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    // Fetch the Customer data from the DB
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { classes: true },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Exclude the password from the response.
    const { password, ...customerWithoutPassword } = customer;

    res.json({ customer: customerWithoutPassword });
  } catch (error) {
    res.status(500).json({ error });
  }
};
