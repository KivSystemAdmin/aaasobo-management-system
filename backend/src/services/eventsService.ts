import { prisma } from "../../prisma/prismaClient";
import { PROTECTED_DEFAULT_EVENT_NAMES } from "../utils/commonUtils";

// Register a new event in the DB
export const registerEvent = async (data: { name: string; color: string }) => {
  await prisma.event.create({ data });

  return;
};

// Fetch all event data.
export const getAllEvents = async () => {
  try {
    return await prisma.event.findMany({
      orderBy: {
        id: "asc",
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch events.");
  }
};

// Fetch the event using the ID
export async function getEventById(id: number) {
  try {
    return prisma.event.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch event.");
  }
}

export async function isProtectedDefaultEvent(id: number) {
  const event = await getEventById(id);
  return (
    !!event &&
    PROTECTED_DEFAULT_EVENT_NAMES.some((eventName) => eventName === event.name)
  );
}

// Update the selected event
export const updateEvent = async (id: number, name: string, color: string) => {
  try {
    // Update the event data.
    const event = await prisma.event.update({
      where: {
        id,
      },
      data: {
        name,
        color,
      },
    });
    return event;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the event data.");
  }
};

// Delete the selected event
export const deleteEvent = async (eventId: number) => {
  try {
    // Delete the Event data.
    const event = await prisma.event.delete({
      where: { id: eventId },
    });

    return event;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete the event.");
  }
};
