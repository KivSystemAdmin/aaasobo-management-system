import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import styles from "./AddLessonButton.module.scss";

function AddLessonButton({ customerId }: { customerId: string }) {
  return (
    <Link
      href={`/customers/${customerId}/dashboard/home/add-lesson`}
      className={styles.link}
    >
      <span className={`${styles.text}`}>Add Lessons</span>{" "}
      <PlusIcon className={`${styles.icon}`} />
    </Link>
  );
}

export default AddLessonButton;
