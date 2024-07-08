import { Request, Response } from "express";
import { pickProperties } from "../helper/commonUtils";
import {
  getAllInstructors,
  createInstructor,
} from "../services/instructorsService";
import bcrypt from "bcrypt";

const saltRounds = 12;

// Admin dashboard for displaying instructors' information
export const getAllInstructorsController = async (
  _: Request,
  res: Response
) => {
  try {
    // Fetch the admin data using the email.
    const instructors = await getAllInstructors();

    // Define the properties to pick.
    const selectedProperties = ["id", "name"];

    // Transform the data structure.
    const data = instructors.map((instructor) =>
      pickProperties(instructor, selectedProperties)
    );

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Register instructor by admin
export const registerInstructorController = async (
  req: Request,
  res: Response
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
