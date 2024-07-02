import { Status } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

// Fetch all the lessons with related instructors and customers data
export const getAllLessons = async () => {
  try {
    const lessons = await prisma.lesson.findMany({
      include: { instructor: true, customer: true },
      orderBy: { dateTime: "desc" },
    });

    return lessons;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch lessons.");
  }
};

// Fetch lessons by customer id along with related instructors and customers data
export const getLessonsByCustomerId = async (customerId: number) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { customerId },
      include: { instructor: true, customer: true },
      orderBy: { dateTime: "desc" },
    });

    return lessons;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch lessons.");
  }
};

// Create a new lesson in the DB
export const createLesson = async (lessonData: {
  dateTime: string;
  instructorId: number;
  customerId: number;
  status: Status;
}) => {
  try {
    return await prisma.lesson.create({
      data: lessonData,
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add lesson.");
  }
};

// Delete a lesson in the DB
export const deleteLesson = async (lessonId: number) => {
  try {
    const deletedLesson = await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return deletedLesson;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete lesson.");
  }
};
