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
