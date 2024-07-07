import { Request, Response } from "express";
import {
  createLesson,
  deleteLesson,
  getAllLessons,
  getLessonsByCustomerId,
} from "../services/lessonsService";
import { prisma } from "../../prisma/prismaClient";

// GET all lessons along with related instructors and customers data
export const getAllLessonsController = async (_: Request, res: Response) => {
  try {
    const lessons = await getAllLessons();

    const lessonsData = lessons.map((lesson) => {
      const { id, dateTime, customer, instructor, status } = lesson;

      return {
        id,
        dateTime,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        instructor: {
          id: instructor.id,
          name: instructor.name,
        },
        status,
      };
    });

    res.json({ lessons: lessonsData });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch lessons." });
  }
};

// GET lessons by customer id along with related instructors and customers data
export const getLessonsByCustomerIdController = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);

  try {
    const lessons = await getLessonsByCustomerId(id);

    const lessonsData = lessons.map((lesson) => {
      const { id, dateTime, customer, instructor, status, lessonAttendance } =
        lesson;

      return {
        id,
        dateTime,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        instructor: {
          id: instructor.id,
          name: instructor.name,
        },
        lessonAttendance: {
          name: lessonAttendance.map(
            (lessonAttendance) => lessonAttendance.children.name
          ),
        },
        status,
      };
    });

    res.json({ lessons: lessonsData });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch lessons." });
  }
};

// POST a new lesson
export const createLessonController = async (req: Request, res: Response) => {
  const { dateTime, instructorId, customerId, childrenIds, status } = req.body;

  // Validation for req.body
  if (!dateTime || !instructorId || !customerId || !childrenIds || !status) {
    return res
      .status(400)
      .json({ error: "There is a missing required field." });
  }

  try {
    const newLesson = await createLesson(
      {
        dateTime,
        instructorId,
        customerId,
        status,
      },
      childrenIds
    );

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
