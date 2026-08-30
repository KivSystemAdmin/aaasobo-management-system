import { prisma } from "../../prisma/prismaClient";
import { Request, Response } from "express";
import {
  getAllSchedules,
  registerSchedules,
  updateSchedules,
  deleteOldBusinessCalendar,
} from "../services/scheduleService";
import {
  getFirstDesignatedDayOfYear,
  convertToISOString,
} from "../utils/dateUtils";
import { RequestWithBody } from "../middlewares/validationMiddleware";
import type { UpdateSundayColorRequest } from "../../../shared/schemas/jobs";

// Admin dashboard for displaying all schedules
export const getAllSchedulesController = async (_: Request, res: Response) => {
  try {
    // Fetch all schedule.
    const data = await getAllSchedules();

    // Organize the data structure
    const organizedData = data.map((schedule) => {
      return {
        id: schedule.id,
        date: schedule.date.toISOString().split("T")[0],
        event: schedule.event.name,
        color: schedule.event.color,
      };
    });

    res.json({ organizedData });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Update the selected business schedule
export const updateBusinessScheduleController = async (
  req: Request,
  res: Response,
) => {
  const eventId = parseInt(req.body.eventId);
  const { startDate, endDate } = req.body;

  if (!startDate || isNaN(eventId)) {
    return res.status(400).json({
      error: "Invalid date or event ID.",
    });
  }

  try {
    // Create date & data list to be sent to the service layer
    const dateList = [];

    if (endDate) {
      const start = new Date(convertToISOString(startDate));
      const end = new Date(convertToISOString(endDate));
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        dateList.push(convertToISOString(d.toISOString().split("T")[0]));
      }
    } else {
      dateList.push(convertToISOString(startDate));
    }

    const dataList = dateList.map((date) => ({
      date,
      eventId,
    }));

    const startDateISO = dateList[0];
    const endDateISO = dateList[dateList.length - 1];

    // Register new schedules and update existing ones
    const result = await prisma.$transaction(async (tx) => {
      await registerSchedules(dataList, tx);
      await updateSchedules(startDateISO, endDateISO, eventId, tx);
      return true;
    });

    res.status(200).json({ result: result });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// Register an event for every Sunday in the requested year, or next year by default
export const updateSundayColorController = async (
  req: RequestWithBody<UpdateSundayColorRequest>,
  res: Response,
) => {
  const { eventId, year } = req.body;

  try {
    // Create date & data list to be sent to the service layer
    const dateList = [];

    const targetYear = year ?? new Date().getFullYear() + 1;

    const firstSunday = getFirstDesignatedDayOfYear(targetYear, "Sun");

    // Generate all Sundays of the target year
    for (
      let d = new Date(firstSunday);
      d.getFullYear() === targetYear;
      d = new Date(d.setDate(d.getDate() + 7))
    ) {
      dateList.push(convertToISOString(d.toISOString().split("T")[0]));
    }

    const dataList = dateList.map((date) => ({
      date,
      eventId,
    }));

    // Register new schedules and update existing ones
    const result = await registerSchedules(dataList);

    if (!result) {
      return res.status(500).json({
        message: "Failed to update Sunday's color.",
      });
    }

    res.status(200).json({
      message: "Sunday colors updated successfully.",
      year: targetYear,
      createdCount: result.count,
    });
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

// Delete business calendar older than 1 year (13 months)
export const deleteOldBusinessCalendarController = async (
  _: Request,
  res: Response,
) => {
  try {
    const deletedBusinessCalendar = await deleteOldBusinessCalendar();
    res.status(200).json({ deletedBusinessCalendar });
  } catch (error) {
    console.error("Error deleting old business calendar", {
      error,
      context: {
        time: new Date().toISOString(),
      },
    });
    res.status(500).json({ error: "Failed to delete old business calendar." });
  }
};
