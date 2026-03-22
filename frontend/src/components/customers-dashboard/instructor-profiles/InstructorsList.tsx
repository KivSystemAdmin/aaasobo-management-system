"use client";

import styles from "./InstructorsList.module.scss";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Modal from "@/components/elements/modal/Modal";
import InputField from "@/components/elements/inputField/InputField";
import ClassInstructor from "@/components/features/classDetail/classInstructor/ClassInstructor";
import InstructorProfileModal from "@/components/customers-dashboard/instructor-profiles/InstructorProfileModal";
import Loading from "@/components/elements/loading/Loading";

export default function InstructorsList({
  instructorProfiles,
  userSessionType,
}: {
  instructorProfiles: InstructorProfile[];
  userSessionType: UserType;
}) {
  const englishBackgroundClass = ["non-native", "native-a", "native-b"];
  const [filteredInstructors, setFilteredInstructors] = useState<
    InstructorProfile[] | null
  >(instructorProfiles);
  const [selectedInstructor, setSelectedInstructor] =
    useState<InstructorProfile | null>(null);
  const { language } = useLanguage();

  // Show loading state while fetching instructor profiles
  if (!instructorProfiles) {
    return <Loading />;
  }

  return (
    <>
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
            onClick={() => setSelectedInstructor(instructor)}
          />
        ))}

        {selectedInstructor && (
          <Modal
            isOpen={!!selectedInstructor}
            onClose={() => setSelectedInstructor(null)}
          >
            <InstructorProfileModal
              instructor={selectedInstructor}
              userSessionType={userSessionType}
            />
          </Modal>
        )}
      </div>
    </>
  );
}
