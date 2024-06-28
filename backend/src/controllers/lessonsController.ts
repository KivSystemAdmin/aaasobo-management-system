import { Request, Response } from "express";
import {
  createLesson,
  deleteLesson,
  getAllLessons,
} from "../services/lessonsService";
import { prisma } from "../../prisma/prismaClient";

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

// POST a new lesson
export const createLessonController = async (req: Request, res: Response) => {
  const { dateTime, instructorId, customerId, status } = req.body;

  // Validation for req.body
  if (!dateTime || !instructorId || !customerId || !status) {
    return res
      .status(400)
      .json({ error: "There is a missing required field." });
  }

  try {
    const newLesson = await createLesson({
      dateTime,
      instructorId,
      customerId,
      status,
    });

    res.status(201).json(newLesson);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to add lessons." });
  }
};

// DELETE a lesson
export const deleteLessonController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const lessonId = parseInt(id, 10);

  try {
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: "Invalid lesson ID." });
    }

    const deletedLesson = await deleteLesson(lessonId);

    return res.status(200).json(deletedLesson);
  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(500).json({
      error: "Failed to delete lesson. Please try again later.",
    });
  }
};
