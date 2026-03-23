import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import styles from "./RebookableInstructorItem.module.scss";
import ClassInstructor from "@/components/features/classDetail/classInstructor/ClassInstructor";
import ExternalLinkComponent from "@/components/elements/externalLink/ExternalLink";

type RebookableInstructorItemProps = {
  instructor: InstructorRebookingProfile;
  isRebookable: boolean;
  language: "ja" | "en";
  adminId?: number;
  customerId?: number;
  onSelect: (instructor: InstructorRebookingProfile) => void;
};

export default function RebookableInstructorItem({
  instructor,
  isRebookable,
  language,
  adminId,
  customerId,
  onSelect,
}: RebookableInstructorItemProps) {
  const englishBackgroundClass = ["non-native", "native-a", "native-b"][
    instructor.englishBackground
  ];
  const instructorProfileUrl = adminId
    ? `/admins/${adminId}/customer-list/instructor-profiles?customerId=${customerId}&instructorId=${instructor.id}`
    : `/customers/${customerId}/instructor-profiles?instructorId=${instructor.id}`;

  return (
    <div
      className={`${styles.instructorItem} ${
        !isRebookable ? styles["instructorItem--disabled"] : ""
      }`}
    >
      <ClassInstructor
        classStatus={englishBackgroundClass}
        instructorIcon={instructor.icon}
        instructorNickname={instructor.nickname}
        width={90}
        className="instructorItem"
      />

      <div className={styles.instructorItem__actions}>
        <ExternalLinkComponent
          linkName={language === "ja" ? "プロフィール" : "Profile"}
          url={instructorProfileUrl}
          className="instructorProfileLink"
        />

        {isRebookable ? (
          <ActionButton
            btnText={language === "ja" ? "選択" : "Select"}
            className="rebookClass"
            onClick={() => onSelect(instructor)}
          />
        ) : (
          <h5>{language === "ja" ? "空きクラスなし" : "Fully booked"}</h5>
        )}
      </div>
    </div>
  );
}
