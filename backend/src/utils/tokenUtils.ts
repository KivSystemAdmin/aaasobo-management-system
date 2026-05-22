import { createHash, timingSafeEqual } from "crypto";

export const hashToken = (rawToken: string) =>
  createHash("sha256").update(rawToken, "utf8").digest("hex");

export const safeCompareHash = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};
