import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import styles from "./AddButton.module.scss";

function AddButton({ linkURL, btnText }: { linkURL: string; btnText: string }) {
  return (
    <Link href={linkURL} className={styles.link}>
      <span className={styles.text}>{btnText}</span>{" "}
      <PlusIcon className={styles.icon} />
    </Link>
  );
}

export default AddButton;
