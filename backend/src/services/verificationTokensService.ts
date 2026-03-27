import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../prisma/prismaClient";
import { Prisma } from "../../generated/prisma";
import { nHoursLater } from "../utils/dateUtils";
import { hashToken, safeCompareHash } from "../utils/tokenUtils";

export const generateVerificationToken = async (
  email: string,
  tx?: Prisma.TransactionClient,
) => {
  const db = tx ?? prisma;
  const rawToken = uuidv4();
  const tokenHash = hashToken(rawToken);
  const expires = nHoursLater(1);

  // Delete an existing token to make only the latest one valid
  const existingToken = await db.verificationToken.findFirst({
    where: { email },
  });

  if (existingToken) {
    await db.verificationToken.delete({
      where: { id: existingToken.id },
    });
  }

  return db.verificationToken
    .create({
      data: { email, token: tokenHash, expires },
    })
    .then((verificationToken) => ({
      ...verificationToken,
      token: rawToken,
    }));
};

export const getVerificationTokenByToken = async (token: string) => {
  const hashedToken = hashToken(token);
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      OR: [{ token: hashedToken }, { token }],
    },
  });

  if (!verificationToken) {
    return null;
  }

  const isHashedTokenMatch = safeCompareHash(
    verificationToken.token,
    hashedToken,
  );
  const isPlainTextTokenMatch = verificationToken.token === token;

  if (!isHashedTokenMatch && !isPlainTextTokenMatch) {
    return null;
  }

  return verificationToken;
};

export const deleteVerificationToken = (
  email: string,
  tx?: Prisma.TransactionClient,
) => {
  const db = tx ?? prisma;
  return db.verificationToken.deleteMany({
    where: { email },
  });
};
