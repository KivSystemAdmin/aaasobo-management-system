"use client";

import styles from "./ChildrenProfiles.module.scss";
import {
  deleteChild,
  editChild,
  getChildrenByCustomerId,
} from "@/app/helper/childrenApi";
import {
  CakeIcon,
  IdentificationIcon,
  PencilIcon,
  UserCircleIcon as UserCircleOutline,
} from "@heroicons/react/24/outline";
import { UserCircleIcon as UserCircleSolid } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import ActionButton from "../../ActionButton";
import { formatBirthdateToISO, formatDateToISO } from "@/app/helper/dateUtils";

function ChildrenProfiles({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
  const [children, setChildren] = useState<Child[] | undefined>([]);
  const [latestChildDataToEdit, setLatestChildDataToEdit] = useState<
    Child | undefined
  >();
  const [childToEdit, setChildToEdit] = useState<Child | undefined>();
  const [editingChildId, setEditingChildId] = useState<number | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const childrenData = await getChildrenByCustomerId(customerId);
        setChildren(childrenData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChildren();
  }, [customerId]);

  useEffect(() => {
    if (children && editingChildId !== null) {
      const childDataToEdit = children.find(
        (child) => child.id === editingChildId,
      );
      setLatestChildDataToEdit(childDataToEdit);
      setChildToEdit(childDataToEdit);
    }
  }, [editingChildId, children]);

  const handleEditClick = (childId: number) => {
    setEditingChildId(childId);
  };

  const handleSaveClick = async () => {
    if (!editingChildId || !childToEdit) return;

    if (
      childToEdit.name === latestChildDataToEdit?.name &&
      childToEdit.birthdate === latestChildDataToEdit?.birthdate &&
      childToEdit.personalInfo === latestChildDataToEdit?.personalInfo
    ) {
      return alert("No changes were made.");
    }

    // Convert birthdate to ISO format or handle if undefined
    let birthdateInISO = "";
    if (childToEdit.birthdate) {
      try {
        birthdateInISO = formatDateToISO(childToEdit.birthdate);
      } catch (error) {
        console.error("Invalid date format:", error);
        return alert("Invalid birthdate format.");
      }
    }

    const personalInfo = childToEdit.personalInfo ?? "";

    try {
      const data = await editChild(
        editingChildId,
        childToEdit.name,
        birthdateInISO,
        personalInfo,
        customerId,
      );
      alert(data.message);

      setEditingChildId(null);

      setChildToEdit(data.child);
      setLatestChildDataToEdit(data.child);
    } catch (error) {
      console.error("Failed to edit child data:", error);
    }
  };

  const handleCancelClick = () => {
    if (latestChildDataToEdit) {
      setChildToEdit(latestChildDataToEdit);
      setEditingChildId(null);
    }
  };

  const handleDeleteClick = async (childId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this child's profile?",
    );
    if (!confirmed) return;

    try {
      const deletedChildData = await deleteChild(childId);
      setChildren((prevChildren) =>
        prevChildren?.filter((child) => child.id !== childId),
      );

      alert(deletedChildData.message);
    } catch (error) {
      console.error("Failed to delete the child profile:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred.");
      }
    }
  };

  return (
    <>
      {children ? (
        <div>
          {children.map((child) => (
            <div className={styles.formContainer} key={child.id}>
              {/* Child Name */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <p className={styles.label__text}>Name</p>

                  {editingChildId === child.id ? (
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.inputField} ${editingChildId === child.id ? styles.editable : ""}`}
                        type="text"
                        value={
                          childToEdit?.id === child.id
                            ? childToEdit.name
                            : child.name
                        }
                        onChange={(e) => {
                          if (editingChildId === child.id) {
                            setChildToEdit((prev) =>
                              prev
                                ? { ...prev, name: e.target.value }
                                : undefined,
                            );
                          }
                        }}
                        required
                      />

                      <UserCircleOutline className={styles.icon} />
                    </div>
                  ) : (
                    <div className={styles.profileInfo}>
                      <UserCircleSolid className={styles.profileInfo__icon} />
                      <div className={styles.profileInfo__data}>
                        {childToEdit && childToEdit.id === child.id
                          ? childToEdit.name
                          : child.name}
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* Birthdate */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <p className={styles.label__text}>Birthdate</p>

                  {editingChildId === child.id ? (
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.inputField} ${editingChildId === child.id ? styles.editable : ""}`}
                        type="date"
                        value={
                          childToEdit?.id === child.id
                            ? formatBirthdateToISO(childToEdit.birthdate)
                            : formatBirthdateToISO(child.birthdate)
                        }
                        readOnly={editingChildId !== child.id}
                        onChange={(e) => {
                          if (editingChildId === child.id) {
                            const newBirthdate = e.target.value;
                            setChildToEdit((prev) =>
                              prev
                                ? { ...prev, birthdate: newBirthdate }
                                : undefined,
                            );
                          }
                        }}
                        required
                      />
                      <CakeIcon className={styles.icon} />
                    </div>
                  ) : (
                    <div className={styles.profileInfo}>
                      <CakeIcon className={styles.profileInfo__icon} />
                      <div className={styles.profileInfo__data}>
                        {childToEdit && childToEdit.id === child.id
                          ? formatBirthdateToISO(childToEdit.birthdate)
                          : formatBirthdateToISO(child.birthdate)}
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  <p className={styles.label__text}>Personal Information</p>

                  {editingChildId === child.id ? (
                    <div className={styles.inputWrapper}>
                      <textarea
                        className={`${styles.inputField} ${styles.textarea} ${editingChildId === child.id ? styles.editable : ""}`}
                        value={
                          childToEdit?.id === child.id
                            ? childToEdit.personalInfo
                            : child.personalInfo
                        }
                        onChange={(e) => {
                          if (editingChildId === child.id) {
                            setChildToEdit((prev) =>
                              prev
                                ? { ...prev, personalInfo: e.target.value }
                                : undefined,
                            );
                          }
                        }}
                        required
                      />
                      <IdentificationIcon className={styles.icon} />
                    </div>
                  ) : (
                    <div className={styles.profileInfo}>
                      <IdentificationIcon
                        className={styles.profileInfo__identificationIcon}
                      />
                      <div className={styles.profileInfo__data}>
                        {childToEdit && childToEdit.id === child.id
                          ? childToEdit.personalInfo
                          : child.personalInfo}
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className={styles.buttonContainer}>
                {editingChildId === child.id ? (
                  <div className={styles.buttonContainer__editing}>
                    <ActionButton
                      className="cancelBtn"
                      btnText="Cancel"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCancelClick();
                      }}
                    />

                    <ActionButton
                      className="saveBtn"
                      btnText="Save"
                      type="button"
                      onClick={() => {
                        handleSaveClick();
                      }}
                    />
                  </div>
                ) : (
                  <div className={styles.buttonContainer__notEditing}>
                    <ActionButton
                      className="deleteBtn"
                      btnText="Delete"
                      onClick={() => handleDeleteClick(child.id)}
                      disabled={editingChildId !== null}
                    />
                    <ActionButton
                      className="editBtn"
                      btnText="Edit"
                      onClick={() => handleEditClick(child.id)}
                      Icon={PencilIcon}
                      disabled={editingChildId !== null}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading ...</p>
      )}
    </>
  );
}

export default ChildrenProfiles;
