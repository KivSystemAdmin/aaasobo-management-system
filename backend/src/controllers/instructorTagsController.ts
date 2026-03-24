import { Response } from "express";
import { RequestWithId } from "../middlewares/parseId.middleware";
import { RequestWithParams } from "../middlewares/validationMiddleware";
import { InstructorIdParams } from "../../../shared/schemas/instructors";
import {
  addTagToCatalog,
  getInstructorTagIds,
  getTagCatalog,
  getTagUsageCounts,
  softDeleteTag,
  updateInstructorTags,
} from "../services/instructorTagsService";

export const getTagCatalogController = async (
  _: RequestWithId,
  res: Response,
) => {
  try {
    const tags = await getTagUsageCounts();
    res.status(200).json({ tags });
  } catch (error) {
    console.error("Error fetching tag catalog", error);
    res.status(500).json({ message: "Failed to fetch tag catalog." });
  }
};

export const createTagController = async (
  req: RequestWithId,
  res: Response,
) => {
  const label = String(req.body?.label ?? "");
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const tag = await addTagToCatalog(label, Number(req.user.id));
    res.status(201).json({ tag });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create tag.";
    const status =
      message.includes("already exists") || message.includes("required")
        ? 400
        : 500;
    res.status(status).json({ message });
  }
};

export const deleteTagController = async (
  req: RequestWithId,
  res: Response,
) => {
  const tagId = Number(req.params.id);
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (Number.isNaN(tagId)) {
    return res.status(400).json({ message: "Invalid tag ID." });
  }

  try {
    await softDeleteTag(tagId, Number(req.user.id));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting tag", error);
    res.status(500).json({ message: "Failed to delete tag." });
  }
};

export const getInstructorTagsController = async (
  req: RequestWithParams<InstructorIdParams>,
  res: Response,
) => {
  try {
    const [catalog, selectedTagIds] = await Promise.all([
      getTagCatalog(),
      getInstructorTagIds(req.params.id),
    ]);

    res.status(200).json({ tags: catalog, selectedTagIds });
  } catch (error) {
    console.error("Error fetching instructor tags", error);
    res.status(500).json({ message: "Failed to fetch instructor tags." });
  }
};

export const updateInstructorTagsController = async (
  req: RequestWithParams<InstructorIdParams> & { body: { tagIds?: number[] } },
  res: Response,
) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tagIds = Array.isArray(req.body?.tagIds)
    ? req.body.tagIds.filter((tagId: number) => Number.isInteger(tagId))
    : [];

  try {
    await updateInstructorTags(req.params.id, tagIds, Number(req.user.id));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating instructor tags", error);
    res.status(500).json({ message: "Failed to update instructor tags." });
  }
};
