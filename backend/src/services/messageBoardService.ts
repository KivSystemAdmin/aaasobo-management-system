import { Prisma } from "../../generated/prisma";
import { prisma } from "../../prisma/prismaClient";

type MessageTarget = "customers" | "instructors" | "both";

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
  target: string,
): target is MessageTarget => {
  return ["customers", "instructors", "both"].includes(target);
};

export type MessageBoardPostRecord = Prisma.MessageBoardPostGetPayload<object>;
