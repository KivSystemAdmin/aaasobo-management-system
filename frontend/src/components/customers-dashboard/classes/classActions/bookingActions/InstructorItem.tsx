"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./InstructorItem.module.scss";
import { textLight } from "@/styles/colors";

interface InstructorItemProps {
  instructor: InstructorRebookingProfile;
  onSelect: (instructor: InstructorRebookingProfile) => void;
  language: "ja" | "en";
  isAvailable: boolean;
  adminId?: number;
  customerId?: number;
}

export default function InstructorItem({
  instructor,
  onSelect,
  language,
  isAvailable,
  adminId,
  customerId,
}: InstructorItemProps) {
  const [imageError, setImageError] = useState(false);
  const englishBackgroundClass = ["non-native", "native-a", "native-b"][
    instructor.englishBackground
  ];
  const instructorProfileUrl = adminId
    ? `/admins/${adminId}/customer-list/instructor-profiles?instructorId=${instructor.id}`
    : `/customers/${customerId}/instructor-profiles?instructorId=${instructor.id}`;

  const handleCardClick = () => {
    if (isAvailable) {
      onSelect(instructor);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className={`${styles.instructorItem} ${
        !isAvailable
          ? styles["instructorItem--disabled"]
          : styles["instructorItem--clickable"]
      }`}
      onClick={handleCardClick}
    >
      <div className={styles.instructorItem__actions}>
        <div className={styles.instructorItem__instructor}>
          <div className={styles.instructorPhoto}>
            {imageError ? (
              <div
                className={
                  styles.placeholderImage + " " + styles[englishBackgroundClass]
                }
              >
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 24 24"
                  fill={textLight}
                >
                  <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                </svg>
              </div>
            ) : (
              <Image
                src={`/instructors/${instructor.icon}`}
                alt={instructor.nickname}
                width={50}
                height={50}
                onError={handleImageError}
              />
            )}
          </div>
          <div onClick={handleProfileClick} className={styles.instructorName}>
            <a
              href={instructorProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.nameLink}
            >
              {instructor.nickname}
              <svg
                className={styles.externalIcon}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
              </svg>
            </a>
          </div>
        </div>

        <div className={styles.instructorItem__bottom}>
          {!isAvailable && (
            <h5>{language === "ja" ? "空きクラスなし" : "Fully booked"}</h5>
          )}
        </div>
      </div>
    </div>
  );
}
