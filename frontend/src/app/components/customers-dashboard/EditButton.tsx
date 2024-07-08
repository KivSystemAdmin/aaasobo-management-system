import { PencilIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import styles from "./EditButton.module.scss";

function EditButton({
  linkURL,
  btnText,
}: {
  linkURL: string;
  btnText: string;
}) {
  return (
    <Link href={linkURL} className={styles.link}>
      <span className={styles.text}>{btnText}</span>{" "}
      <PencilIcon className={styles.icon} />
    </Link>
  );
}

export default EditButton;
