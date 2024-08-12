"use client";

import styles from "./AddChildForm.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { editChild } from "@/app/helper/childrenApi";
import { formatBirthdateToISO, formatDateToISO } from "@/app/helper/dateUtils";
import { useState } from "react";
import {
  CakeIcon,
  IdentificationIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import RedirectButton from "../../RedirectButton";
import ActionButton from "../../ActionButton";

function EditChildForm({
  customerId,
  child,
  isAdminAuthenticated,
}: {
  customerId: string;
  child: Child;
  isAdminAuthenticated?: boolean;
}) {
  const [inputChildName, setInputChildName] = useState(child.name || "");
  const [inputBirthdate, setInputBirthdate] = useState(
    formatBirthdateToISO(child.birthdate || ""),
  );
  const [inputPersonalInfo, setInputPersonalInfo] = useState(
    child.personalInfo || "",
  );

  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // If no information is editted, do not fire POST request
    if (
      child.name === inputChildName &&
      child.birthdate === formatDateToISO(inputBirthdate) &&
      child.personalInfo === inputPersonalInfo
    )
      return alert("No changes have been made to the profile.");

    try {
      const data = await editChild(
        child.id,
        inputChildName,
        formatDateToISO(inputBirthdate),
        inputPersonalInfo,
        customerId,
      );
      alert(data.message); // Set alert message temporarily.

      if (isAdminAuthenticated) {
        // Redirect the user to children-profiles page
        router.push("/admins/child-list");
        return;
      }

      // Redirect the user to children-profiles page
      router.push(`/customers/${customerId}/children-profiles`);
    } catch (error) {
      console.error("Failed to add a new child data:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formContainer}>
        {/* Child Name */}
        <div className={styles.field}>
          <label className={styles.label}>
            Child Name
            <div className={styles.inputWrapper}>
              <input
                className={styles.inputField}
                type="text"
                placeholder="Enter a child name ..."
                value={inputChildName}
                onChange={(e) => setInputChildName(e.target.value)}
                required
              />
              <UserCircleIcon className={styles.icon} />
            </div>
          </label>
        </div>

        {/* Birthdate */}
        <div className={styles.field}>
          <label className={styles.label}>
            <p className={styles.label__text}>Birthdate</p>
            <div className={styles.inputWrapper}>
              <input
                className={styles.inputField}
                type="date"
                value={inputBirthdate}
                onChange={(e) => setInputBirthdate(e.target.value)}
                required
              />
              <CakeIcon className={styles.icon} />
            </div>
          </label>
        </div>

        {/* Personal Info */}
        <div className={styles.field}>
          <label className={styles.label}>
            <p className={styles.label__text}>
              Personal Information{" "}
              <span className={styles.label__details}>
                {" "}
                (age, English level, their interests, favorite foods, etc.)
              </span>
            </p>
            <div className={styles.inputWrapper}>
              <input
                className={styles.inputField}
                type="text"
                placeholder="Example: 5 years old, beginner, cars, bread"
                value={inputPersonalInfo}
                onChange={(e) => setInputPersonalInfo(e.target.value)}
                required
              />
              <IdentificationIcon className={styles.icon} />
            </div>
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        {isAdminAuthenticated ? (
          <RedirectButton
            btnText="Cancel"
            linkURL="/admins/child-list"
            className="cancelBtn"
          />
        ) : (
          <RedirectButton
            btnText="Cancel"
            linkURL={`/customers/${customerId}/children-profiles`}
            className="cancelBtn"
          />
        )}
        <ActionButton type="submit" className="editBtn" btnText="Edit Child" />
      </div>
    </form>
  );
}

export default EditChildForm;
