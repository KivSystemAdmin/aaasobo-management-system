"use client";

import styles from "./AddChildForm.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInput } from "@/app/hooks/useInput";
import { addChild } from "@/app/helper/childrenApi";
import {
  CakeIcon,
  IdentificationIcon,
  PlusIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { formatDateToISO } from "@/app/helper/dateUtils";
import ActionButton from "../../ActionButton";
import RedirectButton from "../../RedirectButton";

function AddChildForm({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
  const [childName, onChildNameChange] = useInput();
  const [childBirthdate, onChildBirthdateChange] = useInput();
  const [childPersonalInfo, onChildPersonalInfoChange] = useInput();

  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const birthdateInISO = formatDateToISO(childBirthdate);

    try {
      const data = await addChild(
        childName,
        birthdateInISO,
        childPersonalInfo,
        customerId,
      );

      alert(data.message); // Set alert message temporarily.

      if (isAdminAuthenticated) {
        // Redirect the admin to children-profiles page
        router.push(`/admins/customer-list/${customerId}`);
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
            <p className={styles.label__text}>Name</p>
            <div className={styles.inputWrapper}>
              <input
                className={styles.inputField}
                type="text"
                placeholder="Enter a name ..."
                value={childName}
                onChange={onChildNameChange}
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
                value={childBirthdate}
                onChange={onChildBirthdateChange}
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
                value={childPersonalInfo}
                onChange={onChildPersonalInfoChange}
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
            linkURL={`/admins/customer-list/${customerId}`}
            className={styles.cancelBtn}
          />
        ) : (
          <RedirectButton
            btnText="Cancel"
            linkURL={`/customers/${customerId}/children-profiles`}
            className="cancelBtn"
          />
        )}

        <ActionButton
          type="submit"
          className="addBtn"
          btnText="Add Child"
          Icon={PlusIcon}
        />
      </div>
    </form>
  );
}

export default AddChildForm;
