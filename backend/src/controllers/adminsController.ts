import { Request, Response } from "express";
import { kv } from "@vercel/kv"; // For production
import { createAdmin, getAdmin } from "../services/adminsService";
import {
  getAllInstructors,
  createInstructor,
} from "../services/instructorsService";
import { getAllCustomers } from "../services/customersService";
import { getAllChildren } from "../services/childrenService";
import bcrypt from "bcrypt";
import { logout } from "../helper/logout";

const saltRounds = 12;

// Login Admin
export const loginAdminController = async (req: Request, res: Response) => {
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

    req.session = {
      userId: admin.id,
      userType: "admin",
    };

    // For production(Save session data to Vercel KV)
    if (process.env.NODE_ENV === "production") {
      const sessionId = req.cookies["session-id"];
      if (sessionId) {
        await kv.set(sessionId, req.session, { ex: 24 * 60 * 60 });
      }
    }

    res.status(200).json({
      message: "Admin logged in successfully",
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Logout Admin
export const logoutAdminController = async (req: Request, res: Response) => {
  return logout(req, res, "admin");
};

// Register Admin
export const registerAdminController = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the admin data into the DB.
    const admin = await createAdmin({ name, email, password: hashedPassword });

    // Exclude the password from the response.
    if (admin) {
      const { password: _, ...adminWithoutPassword } = admin;
      res.status(200).json({
        message: "Admin is registered successfully",
        admin: adminWithoutPassword,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        message: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to register admin",
        error,
      });
    }
  }
};

// Interface for the subscription data to use in the getAllCustomersController.
interface Subscription {
  id: number;
  planId: number;
  customerId: number;
  startAt: Date;
  endAt: Date | null;
  plan: {
    id: number;
    name: string;
  };
  customer: {
    id: number;
    name: string;
    email: string;
    password: string;
    children: {
      id: number;
      customerId: number;
      name: string;
    }[];
  };
}

interface SingleChildSubscription extends Omit<Subscription, "customer"> {
  customer: Omit<Subscription["customer"], "children"> & {
    children: {
      id: number;
      customerId: number;
      name: string;
    };
  };
}

// Admin dashboard for displaying customers' information
export const getAllCustomersController = async (_: Request, res: Response) => {
  try {
    // Fetch all customers data using the email.
    const customers = await getAllCustomers();

    // Transform the data structure.
    const data = customers.map((customer, number) => {
      const { id, name, email, prefecture } = customer;

      return {
        No: number + 1,
        ID: id,
        Name: name,
        Email: email,
        Prefecture: prefecture,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Admin dashboard for displaying instructors' information
export const getAllInstructorsController = async (
  _: Request,
  res: Response,
) => {
  try {
    // Fetch the admin data using the email.
    const instructors = await getAllInstructors();

    // Transform the data structure.
    const data = instructors.map((instructor, number) => {
      const { id, name, nickname, email } = instructor;

      return {
        No: number + 1,
        ID: id,
        Name: name,
        Nickname: nickname,
        Email: email,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Register instructor by admin
export const registerInstructorController = async (
  req: Request,
  res: Response,
) => {
  const {
    name,
    email,
    password,
    nickname,
    icon,
    classURL,
    meetingId,
    passcode,
    introductionURL,
  } = req.body;

  try {
    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the instructor data into the DB.
    const instructor = await createInstructor({
      name,
      email,
      password: hashedPassword,
      nickname,
      icon,
      classURL,
      meetingId,
      passcode,
      introductionURL,
    });

    // Exclude the password from the response.
    if (instructor) {
      const { password: _, ...instructorWithoutPassword } = instructor;
      res.status(200).json({
        message: "Instructor is registered successfully",
        admin: instructorWithoutPassword,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        message: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to register instructor",
        error,
      });
    }
  }
};

// Admin dashboard for displaying instructors' information
export const getAllChildrenController = async (_: Request, res: Response) => {
  try {
    // Fetch all children data using the email.
    const children = await getAllChildren();

    // Transform the data structure.
    const data = children.map((child, number) => {
      const { id, name, customer, birthdate, personalInfo } = child;

      return {
        No: number + 1,
        ID: id,
        Name: name,
        "Customer ID": customer.id,
        "Customer name": customer.name,
        Birthdate: birthdate?.toISOString().slice(0, 10),
        "Personal info": personalInfo,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};
