import { Request, Response } from "express";
import { prisma } from "../../prisma/prismaClient";

export const getAllInstructors = async (_: Request, res: Response) => {
  try {
    // Fetch the instructors and their availabilities data from the DB
    const instructors = await prisma.instructor.findMany({
      include: { instructorAvailability: true },
    });

    // Transform the data structure
    const data = instructors.map(({ id, name, instructorAvailability }) => {
      return {
        id,
        name,
        availabilities: instructorAvailability,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};
