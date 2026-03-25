"use client";

import { useMemo, useState } from "react";
import styles from "./InstructorTags.module.scss";
import {
  createInstructorTagAction,
  deleteInstructorTagAction,
  saveInstructorTagsAction,
} from "@/app/actions/instructorTags";
import {
  getInstructorTags,
  getInstructorTagCatalog,
} from "@/lib/api/instructorsApi";
import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import type {
  InstructorTagsResponse,
  TagCatalogResponse,
} from "@shared/schemas/instructors";

export default function InstructorTags({
  instructorId,
}: {
  instructorId: number;
}) {
  const [catalog, setCatalog] = useState<
    { id: number; label: string; sortOrder: number; assignedCount?: number }[]
  >([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    const [instructorTags, fullCatalog]: [
      InstructorTagsResponse,
      TagCatalogResponse["tags"],
    ] = await Promise.all([
      getInstructorTags(instructorId),
      getInstructorTagCatalog(),
    ]);

    setSelectedTagIds(instructorTags.selectedTagIds);
    setCatalog(fullCatalog);
  }, [instructorId]);

  useEffect(() => {
    load().catch(() => toast.error("Failed to load tags."));
  }, [load]);

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return catalog;
    }
    return catalog.filter((tag) => tag.label.toLowerCase().includes(query));
  }, [catalog, search]);

  const toggleSelection = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await saveInstructorTagsAction(instructorId, selectedTagIds);
      toast.success("Tags saved successfully.");
      await load();
    } catch {
      toast.error("Failed to save tags.");
    } finally {
      setIsSaving(false);
    }
  };

  const createTag = async () => {
    if (!newTagLabel.trim()) {
      return;
    }
    try {
      await createInstructorTagAction(newTagLabel.trim());
      setNewTagLabel("");
      await load();
      toast.success("Tag created successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create tag.",
      );
    }
  };

  const deleteTag = async (tagId: number) => {
    try {
      await deleteInstructorTagAction(tagId);
      await load();
      toast.success("Tag deleted successfully.");
    } catch {
      toast.error("Failed to delete tag.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h3>Assign tags to this instructor</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
          placeholder="Search tags..."
        />
        <div className={styles.checkList}>
          {filteredCatalog.map((tag) => (
            <label key={tag.id} className={styles.row}>
              <input
                type="checkbox"
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => toggleSelection(tag.id)}
              />
              <span>{tag.label}</span>
            </label>
          ))}
        </div>
        <button
          className={styles.primary + " " + styles.save}
          onClick={save}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save selections"}
        </button>
      </div>

      <div className={styles.panel}>
        <h3>Manage shared tag catalog</h3>
        <div className={styles.addRow}>
          <input
            value={newTagLabel}
            onChange={(e) => setNewTagLabel(e.target.value)}
            placeholder="New tag name..."
            className={styles.search}
          />
          <button
            className={styles.primary + " " + styles.add}
            onClick={createTag}
          >
            Add
          </button>
        </div>
        <div className={styles.checkList}>
          {catalog.map((tag) => (
            <div key={tag.id} className={styles.catalogRow}>
              <span>{tag.label}</span>
              <span>{tag.assignedCount ?? 0} instructors</span>
              <button
                onClick={() => deleteTag(tag.id)}
                className={styles.delete}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
