import { Prisma } from "../../generated/prisma";
import { prisma } from "../../prisma/prismaClient";
import { MessageTarget } from "../types";
import {
  MONTHS_TO_DELETE_POSTS,
  MONTHS_TO_GET_POSTS,
} from "../utils/commonUtils";

export const getMessageBoardPosts = async () => {
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - MONTHS_TO_GET_POSTS);

  return prisma.messageBoardPost.findMany({
    where: {
      createdAt: {
        gte: thresholdDate,
      },
    },
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

// Delete message board posts that are older than the threshold
export const deletePastMessageBoardPosts = async () => {
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - MONTHS_TO_DELETE_POSTS);

  return await prisma.messageBoardPost.deleteMany({
    where: {
      createdAt: {
        lt: thresholdDate,
      },
    },
  });
};
