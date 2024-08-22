import React from "react";
import Image from "next/image";
import styles from "./Loading.module.scss";

function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <Image
        src={"/images/spinner.svg"}
        width={100}
        height={100}
        alt="spinner"
      />
    </div>
  );
}

export default Loading;
