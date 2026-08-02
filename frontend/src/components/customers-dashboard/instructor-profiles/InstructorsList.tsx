"use client";

import styles from "./InstructorsList.module.scss";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Modal from "@/components/elements/modal/Modal";
import InputField from "@/components/elements/inputField/InputField";
import ClassInstructor from "@/components/features/classDetail/classInstructor/ClassInstructor";
import InstructorProfileModal from "@/components/customers-dashboard/instructor-profiles/InstructorProfileModal";
import Loading from "@/components/elements/loading/Loading";

export default function InstructorsList({
  instructorProfiles,
  userSessionType,
  designatedInstructorId,
  breadcrumbLink,
  isCustomerView,
}: {
  instructorProfiles: InstructorProfile[];
  userSessionType: UserType;
  designatedInstructorId?: number;
  breadcrumbLink?: string;
  isCustomerView?: boolean;
}) {
  const englishBackgroundClass = ["non-native", "native-a", "native-b"];
  const { language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [clickedInstructor, setClickedInstructor] =
    useState<InstructorProfile | null>(null);
  const [hasClosedDesignatedModal, setHasClosedDesignatedModal] =
    useState(false);

  const designatedInstructor = useMemo(
    () =>
      designatedInstructorId
        ? instructorProfiles.find(
            (instructor) => instructor.id === designatedInstructorId,
          ) || null
        : null,
    [designatedInstructorId, instructorProfiles],
  );

  const selectedInstructor =
    clickedInstructor ||
    (!hasClosedDesignatedModal ? designatedInstructor : null);

  const availableTags = useMemo(() => {
    const map = new Map<
      number,
      { id: number; label: string; sortOrder: number }
    >();
    for (const instructor of instructorProfiles) {
      for (const tag of instructor.tags || []) {
        map.set(tag.id, tag);
      }
    }
    return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [instructorProfiles]);

  const filteredInstructors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return instructorProfiles.filter((instructor) => {
      const matchesSearch = instructor.nickname.toLowerCase().includes(query);
      if (!matchesSearch) {
        return false;
      }

      if (selectedTagIds.length === 0) {
        return true;
      }
      const instructorTagIds = new Set(
        (instructor.tags || []).map((tag) => tag.id),
      );
      return selectedTagIds.every((tagId) => instructorTagIds.has(tagId));
    });
  }, [instructorProfiles, searchQuery, selectedTagIds]);

  if (!instructorProfiles) {
    return <Loading />;
  }

  return (
    <>
      {breadcrumbLink && (
        <nav className={styles.breadcrumb}>
          <ul className={styles.breadcrumb__list}>
            <li className={styles.breadcrumb__item}>
              <Link href={breadcrumbLink}>Customer Page</Link>
            </li>
            <li className={styles.breadcrumb__separator}>{" >> "}</li>
            <li className={styles.breadcrumb__item}>Instructor Profiles</li>
          </ul>
        </nav>
      )}

      <InputField
        type="text"
        placeholder={
          language === "en"
            ? "Search instructors..."
            : "インストラクター検索..."
        }
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.instructorSearch}
      />
      <div className={styles.filterChips}>
        {availableTags.map((tag) => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              className={`${styles.filterChip} ${selected ? styles.selected : ""}`}
              onClick={() =>
                setSelectedTagIds((prev) =>
                  prev.includes(tag.id)
                    ? prev.filter((id) => id !== tag.id)
                    : [...prev, tag.id],
                )
              }
            >
              {tag.label}
            </button>
          );
        })}
        {selectedTagIds.length > 0 && (
          <button
            type="button"
            className={styles.clearFilters}
            onClick={() => setSelectedTagIds([])}
          >
            Clear all
          </button>
        )}
      </div>
      <p className={styles.resultCount}>{filteredInstructors.length} results</p>

      <div className={styles.instructors__list}>
        {filteredInstructors?.map((instructor) => (
          <ClassInstructor
            key={instructor.id}
            classStatus={englishBackgroundClass[instructor.englishBackground]}
            instructorIcon={instructor.icon.url}
            instructorNickname={instructor.nickname}
            width={140}
            className="instructorCursorItem"
            onClick={() => setClickedInstructor(instructor)}
          />
        ))}
      </div>

      {selectedInstructor && (
        <Modal
          isOpen={!!selectedInstructor}
          className="instructorProfile"
          onClose={() => {
            if (clickedInstructor) {
              setClickedInstructor(null);
            } else {
              setHasClosedDesignatedModal(true);
            }
          }}
        >
          <InstructorProfileModal
            instructor={selectedInstructor}
            userSessionType={userSessionType}
            isCustomerView={isCustomerView}
          />
        </Modal>
      )}
    </>
  );
}
