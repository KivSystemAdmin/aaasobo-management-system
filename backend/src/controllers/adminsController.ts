import { Request, Response } from "express";
import {
  getAdminDuplicateCount,
  createAdmin,
  getAdmin,
} from "../services/adminsService";
import bcrypt from "bcrypt";

const saltRounds = 12;

export const registerAdmin = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    // Check if the email is already registered using count.
    const duplicateCount = await getAdminDuplicateCount(email);

    if (duplicateCount > 0) {
      return res.status(400).json({
        message: "Email is already registered",
      });
    }

    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the admin data into the DB.
    const admin = await createAdmin({ name, email, password: hashedPassword });

    // Exclude the password from the response.
    const { password: _, ...adminWithoutPassword } = admin;

    res.status(200).json({
      message: "Admin is registered successfully",
      admin: adminWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal error",
      error,
    });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Fetch the admin data using the email.
    const admin = await getAdmin(email);

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
