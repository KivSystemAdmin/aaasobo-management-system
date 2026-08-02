"use client";

import { useMemo, useState } from "react";
import styles from "./InstructorTags.module.scss";
import {
  createInstructorTagAction,
  deleteInstructorTagAction,
  saveInstructorTagsAction,
  type InstructorTagUpdateState,
} from "@/app/actions/instructorTags";
import { toast } from "react-toastify";
import type {
  InstructorTagsResponse,
  TagCatalogResponse,
} from "@shared/schemas/instructors";
import { confirmAlert } from "@/lib/utils/alertUtils";

export default function InstructorTags({
  instructorId,
  instructorNickName,
  initialInstructorTags,
  initialTagCatalog,
}: {
  instructorId: number;
  instructorNickName: string;
  initialInstructorTags: InstructorTagsResponse | null;
  initialTagCatalog: TagCatalogResponse["tags"];
}) {
  const [catalog, setCatalog] =
    useState<
      { id: number; label: string; sortOrder: number; assignedCount?: number }[]
    >(initialTagCatalog);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    initialInstructorTags?.selectedTagIds ?? [],
  );
  const [persistedSelectedTagIds, setPersistedSelectedTagIds] = useState<
    number[]
  >(initialInstructorTags?.selectedTagIds ?? []);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [, setUpdateResultState] = useState<
    InstructorTagUpdateState | undefined
  >(undefined);

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
      const result = await saveInstructorTagsAction(
        instructorId,
        selectedTagIds,
      );
      setUpdateResultState(result);

      if (result.errorMessage) {
        toast.error(result.errorMessage);
        return;
      }

      const previousSelectedSet = new Set(persistedSelectedTagIds);
      const nextSelectedSet = new Set(selectedTagIds);

      setCatalog((prevCatalog) =>
        prevCatalog.map((tag) => {
          const wasSelected = previousSelectedSet.has(tag.id);
          const isSelected = nextSelectedSet.has(tag.id);
          const count = tag.assignedCount ?? 0;

          if (wasSelected === isSelected) {
            return tag;
          }

          return {
            ...tag,
            assignedCount: isSelected ? count + 1 : Math.max(0, count - 1),
          };
        }),
      );
      const nextSelectedTagIds = result.selectedTagIds ?? selectedTagIds;
      setSelectedTagIds(nextSelectedTagIds);
      setPersistedSelectedTagIds(nextSelectedTagIds);
      toast.success(result.successMessage ?? "Tags saved successfully.");
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
    const result = await createInstructorTagAction(newTagLabel.trim());
    setUpdateResultState(result);

    if (result.errorMessage) {
      toast.error(result.errorMessage);
      return;
    }

    if (result.tag) {
      const { id, label, sortOrder } = result.tag;
      setCatalog((prevCatalog) => [
        ...prevCatalog,
        { id, label, sortOrder, assignedCount: 0 },
      ]);
      setNewTagLabel("");
    }
    toast.success(result.successMessage ?? "Tag created successfully.");
  };

  const deleteTag = async (tagId: number, tagLabel: string) => {
    const confirmed = await confirmAlert(
      `Are you sure you want to delete the "${tagLabel}" tag?`,
    );
    if (!confirmed) {
      return;
    }

    const result = await deleteInstructorTagAction(tagId);
    setUpdateResultState(result);

    if (result.errorMessage) {
      toast.error(result.errorMessage);
      return;
    }

    setCatalog((prevCatalog) =>
      prevCatalog.filter((tag) => tag.id !== (result.deletedTagId ?? tagId)),
    );
    setSelectedTagIds((prevSelectedTagIds) =>
      prevSelectedTagIds.filter((selectedTagId) => selectedTagId !== tagId),
    );
    setPersistedSelectedTagIds((prevSelectedTagIds) =>
      prevSelectedTagIds.filter((selectedTagId) => selectedTagId !== tagId),
    );
    toast.success(result.successMessage ?? "Tag deleted successfully.");
  };

  const handleSaveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await save();
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createTag();
  };

  return (
    <div className={styles.container}>
      <form className={styles.panel} onSubmit={handleSaveSubmit}>
        <h3>
          {instructorNickName
            ? `タグ設定（${instructorNickName} インストラクター）`
            : "このインストラクターのタグ設定"}
        </h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
          placeholder="タグを検索..."
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
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "保存中..." : "保存"}
        </button>
      </form>

      <form className={styles.panel} onSubmit={handleCreateSubmit}>
        <h3>共有タグ管理</h3>
        <div className={styles.addRow}>
          <input
            value={newTagLabel}
            onChange={(e) => setNewTagLabel(e.target.value)}
            placeholder="作成したいタグ名を入力..."
            className={styles.search}
          />
          <button className={styles.primary + " " + styles.add} type="submit">
            追加
          </button>
        </div>
        <div className={styles.checkList}>
          {catalog.map((tag) => (
            <div key={tag.id} className={styles.catalogRow}>
              <span>{tag.label}</span>
              <span>{tag.assignedCount ?? 0} instructors</span>
              <button
                onClick={() => deleteTag(tag.id, tag.label)}
                className={styles.delete}
                type="button"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
