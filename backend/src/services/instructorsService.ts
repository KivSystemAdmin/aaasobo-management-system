import { prisma } from "../../prisma/prismaClient";
import { Instructor } from "../../generated/prisma";
import {
  hashPassword,
  defaultUserImageUrl,
  validateUserImageUrl,
  maskedHeadLetters,
  maskedSuffix,
  maskedBirthdate,
  MONTHS_TO_DELETE_INSTRUCTORS,
} from "../utils/commonUtils";
import { convertToUTCDate } from "../utils/dateUtils";
import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { EnglishBackground } from "../types";

// Register a new instructor account in the DB
export const registerInstructor = async (data: {
  name: string;
  nickname: string;
  email: string;
  password: string;
  icon: Express.Multer.File | undefined;
  birthdate: Date;
  lifeHistory: string;
  favoriteFood: string;
  hobby: string;
  messageForChildren: string;
  workingTime: string;
  skill: string;
  classURL: string;
  meetingId: string;
  passcode: string;
  englishBackground: EnglishBackground;
}) => {
  const hashedPassword = await hashPassword(data.password);
  const icon = data.icon;

  // Check if a new icon is provided.
  let blob;
  if (icon) {
    blob = await put(icon.originalname, icon.buffer, {
      access: "public",
      addRandomSuffix: true,
    });
  } else {
    blob = { url: `${defaultUserImageUrl}?t=${Date.now()}&u=${randomUUID()}` };
  }

  await prisma.instructor.create({
    data: {
      name: data.name,
      nickname: data.nickname,
      email: data.email,
      password: hashedPassword,
      birthdate: data.birthdate,
      lifeHistory: data.lifeHistory,
      favoriteFood: data.favoriteFood,
      hobby: data.hobby,
      messageForChildren: data.messageForChildren,
      workingTime: data.workingTime,
      skill: data.skill,
      icon: blob.url,
      classURL: data.classURL,
      meetingId: data.meetingId,
      passcode: data.passcode,
      englishBackground: data.englishBackground,
    },
  });

  return;
};

// Fetch all instructors information
export const getAllInstructors = async () => {
  try {
    const now = new Date();
    return await prisma.instructor.findMany({
      where: {
        OR: [
          { terminationAt: null }, // Active
          { terminationAt: { gt: now } }, // Active (Future termination)
        ],
      },
      orderBy: { id: "asc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructors.");
  }
};

// Fetch all instructors information
export const getAllPastInstructors = async () => {
  try {
    const now = new Date();
    return await prisma.instructor.findMany({
      where: {
        OR: [
          { terminationAt: { lte: now } }, // Past termination
        ],
      },
      orderBy: { terminationAt: "asc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch past instructors.");
  }
};

export async function getInstructorById(id: number) {
  try {
    return prisma.instructor.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch instructor.");
  }
}

export const updateInstructor = async (
  id: number,
  icon: Express.Multer.File | undefined,
  name: string,
  nickname: string,
  leavingDate: Date | null,
  birthdate: Date,
  workingTime: string,
  lifeHistory: string,
  favoriteFood: string,
  hobby: string,
  messageForChildren: string,
  skill: string,
  email: string,
  classURL: string,
  meetingId: string,
  passcode: string,
  englishBackground: EnglishBackground,
) => {
  try {
    // Fetch the previous instructor data.
    const prevData = await prisma.instructor.findFirst({
      where: {
        id,
      },
    });

    // If no previous data is found, return early.
    if (!prevData) return;

    // Check if a new icon is provided.
    let blob;
    if (icon) {
      // Update the instructor profile icon.
      await del(prevData.icon);
      blob = await put(icon.originalname, icon.buffer, {
        access: "public",
        addRandomSuffix: true,
      });
    } else {
      // Check if the previous icon URL is valid. If not, use the default icon.
      const prevIconUrl = prevData.icon;
      const prevIconId = prevData.id;
      blob = await validateUserImageUrl(prevIconUrl, prevIconId);
    }

    // Update the instructor data.
    const instructor = await prisma.instructor.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        nickname,
        birthdate,
        workingTime,
        lifeHistory,
        favoriteFood,
        hobby,
        messageForChildren,
        skill,
        classURL,
        meetingId,
        passcode,
        icon: blob.url,
        terminationAt: leavingDate
          ? convertToUTCDate(leavingDate, "Asia/Tokyo")
          : null,
        englishBackground,
      },
    });
    return instructor;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the instructor data.");
  }
};

// Fetch the instructor by the email
export const getInstructorByEmail = async (
  email: string,
): Promise<Instructor | null> => {
  return await prisma.instructor.findUnique({
    where: { email },
  });
};

// Fetch the instructor by the nickname
export const getInstructorByNickname = async (
  nickname: string,
): Promise<Instructor | null> => {
  return await prisma.instructor.findUnique({
    where: { nickname },
  });
};

// Fetch the instructor by the class URL
export const getInstructorByClassURL = async (
  classURL: string,
): Promise<Instructor | null> => {
  return await prisma.instructor.findUnique({
    where: { classURL },
  });
};

// Fetch the instructor by the meeting ID
export const getInstructorByMeetingId = async (
  meetingId: string,
): Promise<Instructor | null> => {
  return await prisma.instructor.findUnique({
    where: { meetingId },
  });
};

// Fetch the instructor by the passcode
export const getInstructorByPasscode = async (
  passcode: string,
): Promise<Instructor | null> => {
  return await prisma.instructor.findUnique({
    where: { passcode },
  });
};

export async function getInstructorProfile(instructorId: number) {
  const instructorProfile = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { id: true, name: true, nickname: true, createdAt: true },
  });

  if (!instructorProfile) {
    return null;
  }

  return {
    ...instructorProfile,
    createdAt: instructorProfile.createdAt.toISOString(),
  };
}

export const updateInstructorPassword = async (
  id: number,
  newPassword: string,
) => {
  return await prisma.instructor.update({
    where: { id },
    data: { password: newPassword },
  });
};

export const getInstructorProfiles = async () => {
  const now = new Date();
  const instructors = await prisma.instructor.findMany({
    where: {
      OR: [
        { terminationAt: null }, // Active
        { terminationAt: { gt: now } }, // Active (Future termination)
      ],
    },
  });

  const instructorProfiles = instructors.map((instructor: Instructor) => ({
    id: instructor.id,
    name: instructor.name,
    nickname: instructor.nickname,
    icon: instructor.icon,
    englishBackground: instructor.englishBackground,
  }));

  return instructorProfiles;
};

export const getNativeInstructorProfiles = async () => {
  const now = new Date();
  const instructors = await prisma.instructor.findMany({
    where: {
      OR: [
        { terminationAt: null }, // Active
        { terminationAt: { gt: now } }, // Active (Future termination)
      ],
      englishBackground: {
        in: [EnglishBackground.NativeA, EnglishBackground.NativeB],
      }, // Native (NativeA or NativeB)
    },
  });

  const instructorProfiles = instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.name,
    nickname: instructor.nickname,
    icon: instructor.icon,
    englishBackground: instructor.englishBackground,
  }));

  return instructorProfiles;
};

export const getNonNativeInstructorProfiles = async () => {
  const now = new Date();
  const instructors = await prisma.instructor.findMany({
    where: {
      OR: [
        { terminationAt: null }, // Active
        { terminationAt: { gt: now } }, // Active (Future termination)
      ],
      englishBackground: EnglishBackground.NonNative, // Non-native
    },
  });

  const instructorProfiles = instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.name,
    nickname: instructor.nickname,
    icon: instructor.icon,
    englishBackground: instructor.englishBackground,
  }));

  return instructorProfiles;
};

export const getInstructorContactById = async (id: number) => {
  return prisma.instructor.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
    },
  });
};

// Fetch instructors who have left the organization and has not been masked
export const getInstructorsToMask = async () => {
  try {
    const now = new Date();
    return await prisma.instructor.findMany({
      where: {
        AND: [
          { terminationAt: { not: null } },
          { terminationAt: { lt: now } }, // Past termination
        ],
        classURL: {
          not: {
            contains: maskedHeadLetters, // Not include the word "Masked"
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching instructors to mask:", error);
    throw new Error("Failed to fetch instructors to mask");
  }
};

// Mask instructors who have left the organization
export const maskInstructors = async (instructors: Instructor[]) => {
  const suffix = maskedSuffix;
  try {
    return await prisma.$transaction(
      instructors.map((instructor) =>
        prisma.instructor.update({
          where: { id: instructor.id },
          data: {
            name: maskedHeadLetters,
            email: `${maskedHeadLetters}@${suffix}${instructor.id}.xxx`,
            password: `${maskedHeadLetters}_${suffix}${instructor.id}`,
            birthdate: maskedBirthdate,
            workingTime: maskedHeadLetters,
            lifeHistory: maskedHeadLetters,
            favoriteFood: maskedHeadLetters,
            hobby: maskedHeadLetters,
            messageForChildren: maskedHeadLetters,
            skill: maskedHeadLetters,
            classURL: `${maskedHeadLetters}_${suffix}${instructor.id}`,
            meetingId: `${maskedHeadLetters}_${suffix}${instructor.id}`,
            passcode: `${maskedHeadLetters}_${suffix}${instructor.id}`,
            englishBackground: EnglishBackground.NonNative, // Non-native
          },
        }),
      ),
    );
  } catch (error) {
    console.error("Error masking instructors:", error);
    throw new Error("Failed to mask instructors");
  }
};

// Delete instructors who have left the service more than 3 years ago
export const deletePastInstructors = async () => {
  const thresholdDate = new Date();
  thresholdDate.setMonth(
    thresholdDate.getMonth() - MONTHS_TO_DELETE_INSTRUCTORS,
  );

  return await prisma.instructor.deleteMany({
    where: {
      terminationAt: {
        lt: thresholdDate,
      },
    },
  });
};
