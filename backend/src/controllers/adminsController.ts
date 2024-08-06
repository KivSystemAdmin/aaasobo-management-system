import { Request, Response } from "express";
import { createAdmin, getAdmin } from "../services/adminsService";
import {
  getAllInstructors,
  createInstructor,
} from "../services/instructorsService";
import { getAllSubscriptions } from "../services/subscriptionsService";
import bcrypt from "bcrypt";

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

    // Set the session.
    req.session = {
      userId: admin.id,
      userType: "admin",
    };

    res.status(200).json({
      message: "Admin logged in successfully",
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Logout Admin
export const logoutAdminController = async (req: Request, res: Response) => {
  req.session = null;
  res.status(200).json({
    message: "Admin logged out successfully",
  });
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

// Fetching customers' information
export const getAllCustomersController = async (_: Request, res: Response) => {
  try {
    // Fetch the customers data using the email.
    const subscriptions = await getAllSubscriptions();

    // flatten the subscriptions so that each subscription has a single child
    const flattenedSubscriptions: SingleChildSubscription[] =
      subscriptions.flatMap((subscription) =>
        subscription.customer.children.map((child) => ({
          ...subscription,
          customer: {
            ...subscription.customer,
            children: child,
          },
        })),
      );

    // Transform the data structure.
    const data = flattenedSubscriptions.map((subscription, number) => {
      const { customerId, customer, plan, startAt, endAt } = subscription;

      return {
        No: number + 1,
        ID: customerId,
        Name: customer.name,
        Email: customer.email,
        "Child ID": customer.children.id,
        "Child name": customer.children.name,
        Plan: plan.name,
        "Start date": startAt.toISOString().slice(0, 10),
        "End date": endAt ? endAt.toISOString().slice(0, 10) : null,
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
      const { id, name, nickname, email, classURL } = instructor;

      return {
        No: number + 1,
        ID: id,
        Name: name,
        Nickname: nickname,
        Email: email,
        "Class link": classURL,
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
  const { name, email, password } = req.body;

  try {
    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the instructor data into the DB.
    const instructor = await createInstructor({
      name,
      email,
      password: hashedPassword,
      nickname: "",
      icon: "",
      classURL: "",
      meetingId: "",
      passcode: "",
      introductionURL: "",
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
