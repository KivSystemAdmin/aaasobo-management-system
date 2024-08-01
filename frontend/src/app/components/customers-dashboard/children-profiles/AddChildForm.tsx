"use client";

import styles from "./AddChildForm.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInput } from "@/app/hooks/useInput";
import { addChild } from "@/app/helper/childrenApi";

function AddChildForm({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
  const [childName, onChildNameChange] = useInput();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const data = await addChild(childName, customerId);
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
            Child Name
            <div className={styles.inputWrapper}>
              <input
                className={styles.inputField}
                type="text"
                placeholder="Enter a child name ..."
                value={childName}
                onChange={onChildNameChange}
                required
              />
            </div>
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        {isAdminAuthenticated ? (
          <Link
            href={`/admins/customer-list/${customerId}`}
            className={styles.cancelButton}
          >
            Cancel
          </Link>
        ) : (
          <Link
            href={`/customers/${customerId}/children-profiles`}
            className={styles.cancelButton}
          >
            Cancel
          </Link>
        )}
        <button type="submit" className={styles.submitButton}>
          Add Child
        </button>
      </div>
    </form>
  );
}

export default AddChildForm;
