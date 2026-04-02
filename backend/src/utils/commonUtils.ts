// This file contains common functions that are used in multiple controllers or services.

import bcrypt from "bcrypt";
import { head } from "@vercel/blob";
import { randomUUID } from "crypto";

// Define user roles for authentication
export const AUTH_ROLES = {
  A: ["admin"],
  C: ["customer"],
  I: ["instructor"],
  S: ["system"],
  AC: ["admin", "customer"],
  AI: ["admin", "instructor"],
  ACI: ["admin", "customer", "instructor"],
  ALL: ["admin", "customer", "instructor", "system"],
};

// Booking and class management static values
export const FREE_TRIAL_BOOKING_HOURS = 72;
export const REGULAR_REBOOKING_HOURS = 3;
export const MONTHS_TO_DELETE_CLASSES = 13;
export const MONTHS_TO_DELETE_BUSINESS_CALENDAR = 13;
export const MONTHS_TO_DELETE_ADMINS = 36;
export const MONTHS_TO_DELETE_CUSTOMERS = 36;
export const MONTHS_TO_DELETE_INSTRUCTORS = 36;
export const MONTHS_TO_DELETE_PLANS = 36;
export const MONTHS_TO_DELETE_POSTS = 12;
export const MONTHS_TO_GET_POSTS = 3;

// Masked user static values
export const maskedHeadLetters = "Masked";
export const maskedSuffix = randomUUID().split("-")[0]; // Generate a short random string
export const maskedBirthdate = new Date("1900-01-01");

// Event registration and update static values
export const EVENT_CONFLICT_ITEMS = [
  "Japanese event name",
  "English event name",
  "color code",
];

// Standardize salt rounds for hashing passwords
const saltRounds = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

export const hashPasswordSync = (password: string): string => {
  return bcrypt.hashSync(password, saltRounds);
};

// Default user image URL
export const defaultUserImageUrl = "/images/default-user-icon.jpg";

// Extract specific letters from the blob read/write token
const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN;
const extractTokenLetters = (token: string) => {
  const parts = token.split("_");
  return parts[3] ? parts[3].toLowerCase() : "";
};
const tokenSpecificLetters = extractTokenLetters(blobReadWriteToken || "");

// Create a cache for storing validated user image URLs
const cache = new Map<string, { url: string; checkedAt: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 1; // 1 hour

// Validate user image url
export const validateUserImageUrl = async (url: string, id: number) => {
  const now = Date.now();
  const cached = cache.get(url);

  // Check if the cached URL is still valid
  if (cached && now - cached.checkedAt < CACHE_TTL) {
    return { url: cached.url };
  }

  let blobUrl = defaultUserImageUrl + `?id=${id}`;
  // Validate the URL against the token-specific letters
  if (tokenSpecificLetters && !url.includes(tokenSpecificLetters)) {
    cache.set(url, { url: blobUrl, checkedAt: now });
    return { url: blobUrl };
  }

  // Attempt to fetch the URL to ensure it's valid
  try {
    await head(url);
    blobUrl = url;
  } catch {
    console.warn(
      `[Warning]: Failed to fetch blob for instructor icon (ID: ${id})`,
    );
  }

  cache.set(url, { url: blobUrl, checkedAt: now });
  return { url: blobUrl };
};
