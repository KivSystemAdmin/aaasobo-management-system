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

// Create a new lesson in the DB
export const createLesson = async (lessonData: {
  dateTime: string;
  instructorId: number;
  customerId: number;
  status: Status;
}) => {
  try {
    const dateTime = new Date(lessonData.dateTime);

    return await prisma.lesson.create({
      data: {
        ...lessonData,
        dateTime,
      },
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
