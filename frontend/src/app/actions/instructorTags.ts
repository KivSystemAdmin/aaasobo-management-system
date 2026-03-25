"use server";

import {
  createInstructorTag,
  deleteInstructorTag,
  saveInstructorTags,
} from "@/lib/api/instructorsApi";
import { getCookie } from "../../proxy";
import { revalidateInstructorList } from "./revalidate";

export async function createInstructorTagAction(label: string) {
  const cookie = await getCookie();
  await createInstructorTag(label, cookie);
  revalidateInstructorList();
}

export async function deleteInstructorTagAction(tagId: number) {
  const cookie = await getCookie();
  await deleteInstructorTag(tagId, cookie);
  revalidateInstructorList();
}

export async function saveInstructorTagsAction(
  instructorId: number,
  tagIds: number[],
) {
  const cookie = await getCookie();
  await saveInstructorTags(instructorId, { tagIds }, cookie);
  revalidateInstructorList();
}
