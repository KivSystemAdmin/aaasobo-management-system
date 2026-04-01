import { Prisma } from "../../generated/prisma";
import { prisma } from "../../prisma/prismaClient";
import { MessageTarget } from "../types";

export const getMessageBoardPosts = async () => {
  return prisma.messageBoardPost.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const createMessageBoardPost = async (
  target: MessageTarget,
  body: string,
) => {
  return prisma.messageBoardPost.create({
    data: {
      target,
      body,
    },
  });
};

export const isValidMessageTarget = (
  target: number,
): target is MessageTarget => {
  return Object.values(MessageTarget).includes(target);
};
