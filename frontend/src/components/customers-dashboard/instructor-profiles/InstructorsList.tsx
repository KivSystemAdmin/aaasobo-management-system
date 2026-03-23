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
}: {
  instructorProfiles: InstructorProfile[];
  userSessionType: UserType;
  designatedInstructorId?: number;
  breadcrumbLink?: string;
}) {
  const englishBackgroundClass = ["non-native", "native-a", "native-b"];
  const { language } = useLanguage();

  const [filteredInstructors, setFilteredInstructors] =
    useState(instructorProfiles);
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
        onChange={(e) => {
          const query = e.target.value.toLowerCase();
          setFilteredInstructors(
            instructorProfiles.filter((instructor) =>
              instructor.nickname.toLowerCase().includes(query),
            ),
          );
        }}
        className={styles.instructorSearch}
      />

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
          />
        </Modal>
      )}
    </>
  );
}
