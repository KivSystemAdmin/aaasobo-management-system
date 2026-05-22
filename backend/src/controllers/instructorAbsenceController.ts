import { Response } from "express";
import {
  getInstructorAbsences,
  addInstructorAbsence,
  removeInstructorAbsence,
  CompletedClassAbsenceConflictError,
} from "../services/instructorAbsenceService";
import {
  RequestWithParams,
  RequestWith,
} from "../middlewares/validationMiddleware";
import {
  InstructorIdParams,
  CreateAbsenceRequest,
  InstructorAbsenceParams,
} from "../../../shared/schemas/instructors";

export const getInstructorAbsencesController = async (
  req: RequestWithParams<InstructorIdParams>,
  res: Response,
) => {
  try {
    const instructorId = req.params.id;
    const absences = await getInstructorAbsences(instructorId);

    res.status(200).json({
      message: "Instructor absences retrieved successfully",
      data: absences,
    });
  } catch (error) {
    console.error("Error fetching instructor absences:", error);
    res.status(500).json({
      message: "Failed to fetch instructor absences",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const addInstructorAbsenceController = async (
  req: RequestWith<InstructorIdParams, CreateAbsenceRequest>,
  res: Response,
) => {
  try {
    const instructorId = req.params.id;
    const { absentAt } = req.body;

    const absentAtDate = new Date(absentAt);
    const result = await addInstructorAbsence({
      instructorId,
      absentAt: absentAtDate,
    });

    res.status(201).json({
      message: "Instructor absence added successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error adding instructor absence:", error);

    if (error instanceof CompletedClassAbsenceConflictError) {
      return res.status(409).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to add instructor absence",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const removeInstructorAbsenceController = async (
  req: RequestWithParams<InstructorAbsenceParams>,
  res: Response,
) => {
  try {
    const instructorId = req.params.id;
    const { absentAt } = req.params;

    const absentAtDate = new Date(absentAt);
    const deletedAbsence = await removeInstructorAbsence(
      instructorId,
      absentAtDate,
    );

    res.status(200).json({
      message: "Instructor absence removed successfully",
      data: deletedAbsence,
    });
  } catch (error) {
    console.error("Error removing instructor absence:", error);
    res.status(500).json({
      message: "Failed to remove instructor absence",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
