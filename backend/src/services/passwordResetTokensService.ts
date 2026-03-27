import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../prisma/prismaClient";
import { nHoursLater } from "../utils/dateUtils";
import { hashToken, safeCompareHash } from "../utils/tokenUtils";

export const generatePasswordResetToken = async (email: string) => {
  const rawToken = uuidv4();
  const tokenHash = hashToken(rawToken);
  const expires = nHoursLater(1);

  // Delete an existing token to make only the latest one valid
  const existingToken = await prisma.passwordResetToken.findFirst({
    where: { email },
  });

  if (existingToken) {
    await prisma.passwordResetToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const passwordResetToken = await prisma.passwordResetToken.create({
    data: {
      email,
      token: tokenHash,
      expires,
    },
  });

  return {
    ...passwordResetToken,
    token: rawToken,
  };
};

export const getPasswordResetTokenByToken = async (token: string) => {
  const hashedToken = hashToken(token);

  const passwordResetToken = await prisma.passwordResetToken.findFirst({
    where: {
      OR: [{ token: hashedToken }, { token }],
    },
  });

  if (!passwordResetToken) {
    return null;
  }

  const isHashedTokenMatch = safeCompareHash(
    passwordResetToken.token,
    hashedToken,
  );
  const isPlainTextTokenMatch = passwordResetToken.token === token;

  if (!isHashedTokenMatch && !isPlainTextTokenMatch) {
    return null;
  }

  return passwordResetToken;
};

export const deletePasswordResetToken = (email: string) => {
  return prisma.passwordResetToken.deleteMany({
    where: { email },
  });
};
