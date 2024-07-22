import { Request, Response } from "express";
import { pickProperties } from "../helper/commonUtils";
import {
  getAllInstructors,
  createInstructor,
} from "../services/instructorsService";
import { getAllSubscriptions } from "../services/subscriptionsService";
import bcrypt from "bcrypt";

const saltRounds = 12;

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
    const transformedSubscriptions = flattenedSubscriptions.map(
      (subscription) => {
        const { customerId, customer, plan, startAt, endAt } = subscription;

        return {
          id: customerId,
          name: customer.name,
          email: customer.email,
          childName: customer.children.name,
          plan: plan.name,
          startDate: startAt.toISOString().slice(0, 10),
          endDate: endAt,
        };
      },
    );

    res.json({ transformedSubscriptions });
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

    // Define the properties to pick.
    const selectedProperties = ["id", "name"];

    // Transform the data structure.
    const data = instructors.map((instructor) =>
      pickProperties(instructor, selectedProperties),
    );

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
  const { name, email, password, nickname, icon, classLink } = req.body;

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
      classLink,
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
