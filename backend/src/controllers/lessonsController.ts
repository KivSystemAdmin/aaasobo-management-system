import { Request, Response } from "express";
import { getAllLessons } from "../services/lessonsService";

// GET all lessons
export const getAllLessonsController = async (_: Request, res: Response) => {
  try {
    const lessons = await getAllLessons();

    const lessonsData = lessons.map((lesson) => ({
      id: lesson.id,
      dateTime: lesson.dateTime,
      customer: {
        id: lesson.customer.id,
        name: lesson.customer.name,
        email: lesson.customer.email,
      },
      instructor: {
        id: lesson.instructor.id,
        name: lesson.instructor.name,
      },
      status: lesson.status,
    }));

    res.json({ lessons: lessonsData });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch lessons." });
  }
};
