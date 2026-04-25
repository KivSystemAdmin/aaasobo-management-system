import { Response } from "express";
import {
  getInstructorSchedules,
  getScheduleWithSlots,
  createInstructorSchedule,
  getInstructorAvailableSlots,
  getInstructorCalendarSlots,
  getAllAvailableSlots,
  getActiveInstructorSchedule,
  getAvailableSlotsByType,
} from "../services/instructorScheduleService";
import { Request } from "express";
import {
  RequestWithParams,
  RequestWithQuery,
  RequestWith,
} from "../middlewares/validationMiddleware";
import {
  InstructorIdParams,
  AvailableSlotsQuery,
  InstructorAvailableSlotsQuery,
  CreateScheduleRequest,
  CreateSlotRequest,
  InstructorScheduleParams,
  ActiveScheduleQuery,
} from "../../../shared/schemas/instructors";
import { EnglishBackground } from "../types";

export const getInstructorSchedulesController = async (
  req: RequestWithParams<InstructorIdParams>,
  res: Response,
) => {
  try {
    const schedules = await getInstructorSchedules(req.params.id);

    res.status(200).json({
      message: "Instructor schedule versions retrieved successfully",
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching instructor schedule versions:", error);
    res.status(500).json({
      message: "Failed to fetch instructor schedule versions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getInstructorScheduleController = async (
  req: RequestWithParams<InstructorScheduleParams>,
  res: Response,
) => {
  try {
    const schedule = await getScheduleWithSlots(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    res.status(200).json({
      message: "Schedule retrieved successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      message: "Failed to fetch schedule",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createInstructorScheduleController = async (
  req: RequestWith<InstructorIdParams, CreateScheduleRequest>,
  res: Response,
) => {
  try {
    const { effectiveFrom, slots, timezone } = req.body;

    const schedule = await createInstructorSchedule({
      instructorId: req.params.id,
      effectiveFrom: new Date(effectiveFrom),
      timezone,
      slots: slots.map((slot: CreateSlotRequest) => ({
        weekday: slot.weekday,
        startTime: slot.startTime,
      })),
    });

    res.status(201).json({
      message: "Schedule version created successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Error creating schedule version:", error);

    res.status(500).json({
      message: "Failed to create schedule version",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getInstructorAvailableSlotsController = async (
  req: RequestWith<InstructorIdParams, {}, InstructorAvailableSlotsQuery>,
  res: Response,
) => {
  try {
    const { start, end, timezone, excludeBookedSlots } = req.query;

    // Convert excludeBookedSlots parameter to boolean
    const shouldExcludeBooked = excludeBookedSlots === "true";

    const availableSlots = await getInstructorAvailableSlots(
      req.params.id,
      start,
      end,
      timezone,
      shouldExcludeBooked,
    );

    res.status(200).json({
      message: "Available slots retrieved successfully",
      data: availableSlots,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({
      message: "Failed to fetch available slots",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getInstructorCalendarSlotsController = async (
  req: RequestWith<InstructorIdParams, {}, InstructorAvailableSlotsQuery>,
  res: Response,
) => {
  try {
    const { start, end, timezone } = req.query;

    const calendarSlots = await getInstructorCalendarSlots(
      req.params.id,
      start,
      end,
      timezone,
    );

    res.status(200).json({
      message: "Instructor calendar slots retrieved successfully",
      data: calendarSlots,
    });
  } catch (error) {
    console.error("Error fetching instructor calendar slots:", error);
    res.status(500).json({
      message: "Failed to fetch instructor calendar slots",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllAvailableSlotsController = async (
  req: RequestWithQuery<AvailableSlotsQuery>,
  res: Response,
) => {
  try {
    const { start, end, timezone } = req.query;

    const availableSlots = await getAllAvailableSlots(start, end, timezone);

    res.status(200).json({
      message: "Available slots retrieved successfully",
      data: availableSlots,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({
      message: "Failed to fetch available slots",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAvailableSlotsByTypeController = async (
  req: RequestWithQuery<AvailableSlotsQuery>,
  res: Response,
) => {
  try {
    const { start, end, timezone, englishBackground } = req.query;
    const englishBackgroundInt = parseInt(englishBackground, 10);

    // Organize the English backgrounds array depending on the index provided in the request
    // Ex1: if the index is 2 (NativeB), the array will be [0, 1, 2] (NativeB, NonNative, NativeA)
    // Ex2: if the index is 1 (NativeA), the array will be [0, 1] (NativeA, NonNative)
    // Ex3: if the index is 0 (NonNative), the array will be [0] (NonNative)
    const ordered = [
      EnglishBackground.NonNative,
      EnglishBackground.NativeA,
      EnglishBackground.NativeB,
    ];
    const englishBackgroundArray = ordered.slice(0, englishBackgroundInt + 1);
    const availableSlots = await getAvailableSlotsByType(
      start,
      end,
      timezone,
      englishBackgroundArray,
    );

    res.status(200).json({
      message: "Available slots retrieved successfully",
      data: availableSlots,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({
      message: "Failed to fetch available slots",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getActiveInstructorScheduleController = async (
  req: RequestWith<InstructorIdParams, {}, ActiveScheduleQuery>,
  res: Response,
) => {
  try {
    const { effectiveDate } = req.query;

    const activeSchedule = await getActiveInstructorSchedule(
      req.params.id,
      effectiveDate,
    );

    if (!activeSchedule) {
      return res.status(404).json({
        message: "No active schedule found for this instructor",
      });
    }

    res.status(200).json({
      message: "Active schedule retrieved successfully",
      data: activeSchedule,
    });
  } catch (error) {
    console.error("Error fetching active instructor schedule:", error);
    res.status(500).json({
      message: "Failed to fetch active instructor schedule",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
