"use client";

import styles from "./InstructorProfileModal.module.scss";
import InstructorProfile from "@/components/instructors-dashboard/instructor-profile/InstructorProfile";

const InstructorProfileModal = ({
  instructor,
  userSessionType,
  width = "100%",
  isCustomerView,
}: {
  instructor: InstructorProfile;
  userSessionType: UserType;
  width?: string;
  isCustomerView?: boolean;
}) => {
  return (
    <div className={styles.modalContent} style={{ width }}>
      <InstructorProfile
        instructor={instructor}
        userSessionType={userSessionType}
        isCustomerView={isCustomerView}
      />
    </div>
  );
};

export default InstructorProfileModal;
