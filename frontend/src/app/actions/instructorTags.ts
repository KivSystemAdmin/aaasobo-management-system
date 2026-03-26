"use server";

import {
  createInstructorTag,
  deleteInstructorTag,
  saveInstructorTags,
} from "@/lib/api/instructorsApi";
import { getCookie } from "../../proxy";
import { revalidateInstructorList } from "./revalidate";
import type { TagCatalogResponse } from "@shared/schemas/instructors";

export type InstructorTagUpdateState = {
  successMessage?: string;
  errorMessage?: string;
  tag?: TagCatalogResponse["tags"][number];
  selectedTagIds?: number[];
  deletedTagId?: number;
};

export async function createInstructorTagAction(
  label: string,
): Promise<InstructorTagUpdateState> {
  try {
    const cookie = await getCookie();
    const tag = await createInstructorTag(label, cookie);
    revalidateInstructorList();
    return {
      successMessage: "Tag created successfully.",
      tag,
    };
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error ? error.message : "Failed to create tag.",
    };
  }
}

export async function deleteInstructorTagAction(
  tagId: number,
): Promise<InstructorTagUpdateState> {
  try {
    const cookie = await getCookie();
    await deleteInstructorTag(tagId, cookie);
    revalidateInstructorList();
    return {
      successMessage: "Tag deleted successfully.",
      deletedTagId: tagId,
    };
  } catch {
    return {
      errorMessage: "Failed to delete tag.",
    };
  }
}

export async function saveInstructorTagsAction(
  instructorId: number,
  tagIds: number[],
): Promise<InstructorTagUpdateState> {
  try {
    const cookie = await getCookie();
    await saveInstructorTags(instructorId, { tagIds }, cookie);
    revalidateInstructorList();
    return {
      successMessage: "Tags saved successfully.",
      selectedTagIds: tagIds,
    };
  } catch {
    return {
      errorMessage: "Failed to save tags.",
    };
  }
}
