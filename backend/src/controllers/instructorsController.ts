import { Instructor } from "@prisma/client";
import { Request, Response } from "express";
import { RequestWithParams } from "../middlewares/validationMiddleware";
import {
  InstructorIdParams,
  ClassIdParams,
  EnglishBackgroundParams,
  InstructorClassParams,
} from "../../../shared/schemas/instructors";
import { validateUserImageUrl } from "../utils/commonUtils";
import {
  getInstructorById,
  getAllInstructors,
  getInstructorProfile,
  getInstructorProfiles,
  getInstructorsToMask,
  maskInstructors,
  getInstructorProfilesByEnglishBackground,
  deletePastInstructors,
} from "../services/instructorsService";
import { type RequestWithId } from "../middlewares/parseId.middleware";
import {
  getCalendarClasses,
  getSameDateClasses,
  getClassByClassId,
} from "../services/classesService";
import { convertToTimezoneDate } from "../utils/dateUtils";
import { EnglishBackground } from "../types";
import { getTagsByInstructorIds } from "../services/instructorTagsService";

function setErrorResponse(res: Response, error: unknown) {
  return res
    .status(500)
    .json({ message: error instanceof Error ? error.message : `${error}` });
}

// Fetch instructor id by class id
export const getInstructorIdByClassIdController = async (
  req: RequestWithParams<ClassIdParams>,
  res: Response,
) => {
  try {
    const classInfo = await getClassByClassId(req.params.id);

    if (!classInfo) {
      return res.status(404).json({ error: "Applicable class not found." });
    }

    res.status(200).json({
      instructorId: classInfo.instructorId,
    });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch classes." });
  }
};

export const getInstructor = async (
  req: RequestWithParams<InstructorIdParams>,
  res: Response,
) => {
  try {
    const instructor = await getInstructorById(req.params.id);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found." });
    }

    // Fetch the blob for the instructor's icon
    const instructorId = instructor.id;
    const instructorIcon = instructor.icon;
    const blob = await validateUserImageUrl(instructorIcon, instructorId);
    // Convert terminationAt from UTC to JST
    const terminationAt = instructor.terminationAt
      ? convertToTimezoneDate(instructor.terminationAt, "Asia/Tokyo")
      : null;

    const tags = await getTagsByInstructorIds([instructorId]);

    return res.status(200).json({
      instructor: {
        id: instructorId,
        name: instructor.name,
        nickname: instructor.nickname,
        email: instructor.email,
        icon: blob,
        birthdate: instructor.birthdate,
        lifeHistory: instructor.lifeHistory,
        favoriteFood: instructor.favoriteFood,
        hobby: instructor.hobby,
        messageForChildren: instructor.messageForChildren,
        workingTime: instructor.workingTime,
        skill: instructor.skill,
        classURL: instructor.classURL,
        meetingId: instructor.meetingId,
        passcode: instructor.passcode,
        terminationAt: terminationAt,
        englishBackground: instructor.englishBackground,
        tags: tags.map((tag) => ({
          id: tag.id,
          label: tag.label,
          sortOrder: tag.sortOrder,
        })),
      },
    });
  } catch (error) {
    return setErrorResponse(res, error);
  }
};

// Get all instructor profiles for customer dashboard
export const getAllInstructorProfilesController = async (
  _: Request,
  res: Response,
) => {
  try {
    const instructors = await getAllInstructors();
    if (!instructors) {
      return res.status(404).json({ message: "Instructors not found." });
    }

    // Map the instructors to include only the necessary fields for the profile.
    const instructorIds = instructors.map((instructor) => instructor.id);
    const tags = await getTagsByInstructorIds(instructorIds);
    const tagsByInstructorId = new Map<number, typeof tags>();
    for (const tag of tags) {
      const current = tagsByInstructorId.get(tag.instructorId) || [];
      current.push(tag);
      tagsByInstructorId.set(tag.instructorId, current);
    }

    const instructorProfiles = await Promise.all(
      instructors.map(async (instructor: Instructor) => {
        // Validate the instructor's icon URL
        const instructorId = instructor.id;
        const instructorIcon = instructor.icon;
        const blob = await validateUserImageUrl(instructorIcon, instructorId);
        // Convert from UTC to JST
        const terminationAt = instructor.terminationAt
          ? convertToTimezoneDate(instructor.terminationAt, "Asia/Tokyo")
          : null;

        return {
          id: instructorId,
          name: instructor.name,
          icon: blob,
          nickname: instructor.nickname,
          birthdate: instructor.birthdate,
          lifeHistory: instructor.lifeHistory,
          favoriteFood: instructor.favoriteFood,
          hobby: instructor.hobby,
          messageForChildren: instructor.messageForChildren,
          workingTime: instructor.workingTime,
          skill: instructor.skill,
          createdAt: instructor.createdAt,
          terminationAt: terminationAt,
          englishBackground: instructor.englishBackground,
          tags: (tagsByInstructorId.get(instructor.id) || []).map((tag) => ({
            id: tag.id,
            label: tag.label,
            sortOrder: tag.sortOrder,
          })),
        };
      }),
    );

    return res.status(200).json({ instructorProfiles });
  } catch (error) {
    return setErrorResponse(res, error);
  }
};

export const getInstructorProfileController = async (
  req: RequestWithParams<InstructorIdParams>,
  res: Response,
) => {
  const instructorId = req.params.id;

  try {
    const profile = await getInstructorProfile(instructorId);

    if (!profile) {
      return res.sendStatus(404);
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching instructor profile", {
      error,
      context: {
        ID: instructorId,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const getCalendarClassesController = async (
  req: RequestWithParams<InstructorIdParams>,
  res: Response,
) => {
  try {
    const classes = await getCalendarClasses(req.params.id);
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error getting instructor calendar classes", {
      error,
      context: {
        instructorId: req.params.id,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const getInstructorProfilesController = async (
  _: Request,
  res: Response,
) => {
  try {
    const instructorProfiles = await getInstructorProfiles();
    if (!instructorProfiles) {
      res.sendStatus(404);
    }

    res.status(200).json(instructorProfiles);
  } catch (error) {
    console.error("Error fetching instructor profiles", {
      error,
      context: {
        time: new Date().toISOString(),
      },
    });
    return setErrorResponse(res, error);
  }
};

export const getInstructorProfilesByEnglishBackgroundController = async (
  req: RequestWithParams<EnglishBackgroundParams>,
  res: Response,
) => {
  const englishBackgroundIndex = req.params
    .englishBackground as EnglishBackground;

  // Organize the English backgrounds array depending on the index provided in the request
  // Ex1: if the index is 2 (NativeB), the array will be [0, 1, 2] (NativeB, NonNative, NativeA)
  // Ex2: if the index is 1 (NativeA), the array will be [0, 1] (NativeA, NonNative)
  // Ex3: if the index is 0 (NonNative), the array will be [0] (NonNative)
  const ordered = [
    EnglishBackground.NonNative,
    EnglishBackground.NativeA,
    EnglishBackground.NativeB,
  ];
  const englishBackgroundArray = ordered.slice(0, englishBackgroundIndex + 1);

  try {
    const instructorProfiles = await getInstructorProfilesByEnglishBackground(
      englishBackgroundArray,
    );
    if (!instructorProfiles) {
      res.sendStatus(404);
    }

    res.status(200).json(instructorProfiles);
  } catch (error) {
    console.error("Error fetching instructor profiles by English background", {
      error,
      context: {
        time: new Date().toISOString(),
      },
    });
    return setErrorResponse(res, error);
  }
};

export const getSameDateClassesController = async (
  req: RequestWithParams<InstructorClassParams>,
  res: Response,
) => {
  try {
    const classes = await getSameDateClasses(req.params.id, req.params.classId);
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error getting same-date classes for instructor", {
      error,
      context: {
        instructorId: req.params.id,
        classId: req.params.classId,
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};

export const maskInstructorsController = async (_: Request, res: Response) => {
  try {
    // Fetch instructors who have left the organization and has not been masked
    const instructorsToMask = await getInstructorsToMask();
    const maskedInstructors = await maskInstructors(instructorsToMask);
    res.status(200).json(maskedInstructors);
  } catch (error) {
    console.error("Error masking instructors", {
      error,
      context: {
        time: new Date().toISOString(),
      },
    });
    return setErrorResponse(res, error);
  }
};

// Delete instructors who have left the service more than 3 years ago
export const deletePastInstructorsController = async (
  _: Request,
  res: Response,
) => {
  try {
    const deletedInstructors = await deletePastInstructors();
    res.status(200).json({ deletedInstructors });
  } catch (error) {
    console.error("Error deleting past instructors", {
      error,
      context: {
        time: new Date().toISOString(),
      },
    });
    res.sendStatus(500);
  }
};
