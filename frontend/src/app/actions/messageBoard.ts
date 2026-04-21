"use server";

import { createMessageBoardPost } from "@/lib/api/adminsApi";
import { getCookie } from "@/proxy";
import type {
  CreateMessageBoardPostRequest,
  CreateMessageBoardPostResponse,
} from "@shared/schemas/admins";

export type MessageBoardActionState = {
  successMessage?: string;
  errorMessage?: string;
  message?: CreateMessageBoardPostResponse["data"];
};

export async function createMessageBoardPostAction(
  payload: CreateMessageBoardPostRequest,
): Promise<MessageBoardActionState> {
  try {
    const cookie = await getCookie();
    const result = await createMessageBoardPost(payload, cookie);

    return {
      successMessage: "Message sent successfully.",
      message: result.data,
    };
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error ? error.message : "Failed to send message.",
    };
  }
}
