import { Request, Response } from "express";
import { prisma } from "../../prisma/prismaClient";
import bcrypt from "bcrypt";

const saltRounds = 12;

export const registerAdmin = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // Hash the password.
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    // Insert the admin data into the DB.
    const admin = await prisma.admins.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Exclude the password from the response.
    const { password: _, ...adminWithoutPassword } = admin;

    res.status(200).json({
      redirectUrl: "/login",
      message: "Admin is registered successfully",
      admin: adminWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const admin = await prisma.admins.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check if the password is correct or not.
    const result = await bcrypt.compare(password, admin.password);

    if (!result) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Exclude the password from the response.
    const { password: _, ...adminWithoutPassword } = admin;

    res.status(200).json({
      redirectUrl: "/admins",
      message: "Admin logged in successfully",
      admin: adminWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};
