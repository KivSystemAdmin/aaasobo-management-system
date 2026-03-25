import styles from "./ClassInstructor.module.scss";
import Image from "next/image";
import { useId, useState } from "react";
import { defaultUserImageUrl } from "@/lib/data/data";

const ClassInstructor = ({
  classStatus,
  instructorIcon,
  instructorNickname,
  className,
  width = 135,
  onClick,
}: {
  classStatus: string;
  instructorIcon: string;
  instructorNickname: string;
  className?: string;
  width?: number;
  onClick?: () => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const cacheBust = useId();
  const handleImageError = () => {
    setImageError(true);
  };
  return (
    <div className={`${styles.instructor} ${className && styles[className]}`}>
      <Image
        src={
          imageError ? defaultUserImageUrl : `${instructorIcon}?t=${cacheBust}`
        }
        alt={instructorNickname}
        width={width}
        height={width}
        unoptimized
        className={`${styles.instructor__icon} ${styles[classStatus]}`}
        onClick={onClick}
        onError={handleImageError}
      />
      <div className={styles.instructor__name}>{instructorNickname}</div>
    </div>
  );
};

export default ClassInstructor;
