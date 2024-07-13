import { Status } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

// Fetch all the classes with related instructors and customers data
export const getAllClasses = async () => {
  try {
    const classes = await prisma.class.findMany({
      include: { instructor: true, customer: true },
      orderBy: { dateTime: "desc" },
    });

    return classes;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch classes.");
  }
};

// Fetch classes by customer id along with related instructors and customers data
export const getClassesByCustomerId = async (customerId: number) => {
  try {
    const classes = await prisma.class.findMany({
      where: { customerId },
      include: {
        instructor: true,
        customer: true,
        classAttendance: { include: { children: true } },
      },
      orderBy: { dateTime: "desc" },
    });

    return classes;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch classes.");
  }
};

// Create a new class in the DB
export const createClass = async (
  classData: {
    dateTime: string;
    instructorId: number;
    customerId: number;
    status: Status;
    subscriptionId: number;
  },
  childrenIds: number[]
) => {
  try {
    const CreatedClass = await prisma.class.create({
      data: classData,
    });
    const classAttendancePromises = childrenIds.map((childrenId) => {
      return prisma.classAttendance.create({
        data: {
          classId: CreatedClass.id,
          childrenId,
        },
      });
    });
    const classAttendance = await Promise.all(classAttendancePromises);

    return { CreatedClass, classAttendance };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to add class.");
  }
};

// Delete a class in the DB
export const deleteClass = async (classId: number) => {
  try {
    await prisma.classAttendance.deleteMany({
      where: { classId },
    });
    const deletedClass = await prisma.class.delete({
      where: { id: classId },
    });

    return deletedClass;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete class.");
  }
};

// Check if a child has a booked class by the child's id
export const checkIfChildHasBookedClass = async (
  childId: number
): Promise<boolean> => {
  try {
    const bookedClass = await prisma.classAttendance.findFirst({
      where: { childrenId: childId, class: { status: "booked" } },
      include: { class: true },
    });

    // Return true if a booked class was found, otherwise false
    return bookedClass !== null;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to check if a child has a booked class.");
  }
};

// Check if a child has a completed class by the child's id
export const checkIfChildHasCompletedClass = async (
  childId: number
): Promise<boolean> => {
  try {
    const completedClass = await prisma.classAttendance.findFirst({
      where: { childrenId: childId, class: { status: "completed" } },
      include: { class: true },
    });

    // Return true if a completed class was found, otherwise false
    return completedClass !== null;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to check if a child has a completed class.");
  }
};

// Fetch a class by class id along with related instructors, customers, and children data
export const getClassById = async (classId: number) => {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        instructor: true,
        customer: true,
        classAttendance: { include: { children: true } },
      },
    });

    return classData;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch a class.");
  }
};

// Update/Edit a class
export const updateClass = async (
  classId: number,
  dateTime: string,
  instructorId: number,
  childrenIds: number[]
) => {
  try {
    const updatedClass = await prisma.$transaction(async (prisma) => {
      // Update the Class data
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: {
          dateTime,
          instructorId,
        },
      });

      // Delete existing classAttendance records
      await prisma.classAttendance.deleteMany({
        where: { classId },
      });

      // Add new classAttendance records
      await prisma.classAttendance.createMany({
        data: childrenIds.map((childId) => ({ classId, childrenId: childId })),
      });

      return updatedClass;
    });

    return updatedClass;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update a class.");
  }
};

export async function countClassesOfSubscription(
  subscriptionId: number,
  until: Date
) {
  try {
    return await prisma.class.count({
      where: {
        subscriptionId,
        OR: [{ status: "booked" }, { status: "completed" }],
        dateTime: { lte: until },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to count lessons.");
  }
}
