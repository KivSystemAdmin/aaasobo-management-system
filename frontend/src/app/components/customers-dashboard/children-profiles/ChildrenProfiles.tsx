"use client";

import styles from "./ChildrenProfiles.module.scss";
import {
  deleteChild,
  editChild,
  getChildrenByCustomerId,
} from "@/app/helper/childrenApi";
import {
  PlusIcon,
  UserCircleIcon as UserCircleSolid,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import ActionButton from "../../ActionButton";
import { formatBirthdateToISO, formatDateToISO } from "@/app/helper/dateUtils";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RedirectButton from "../../RedirectButton";

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
      return toast.info("No changes were made.");
    }

    let birthdateInISO = "";
    if (childToEdit.birthdate) {
      try {
        birthdateInISO = formatDateToISO(childToEdit.birthdate);
      } catch (error) {
        console.error("Invalid date format:", error);
        return toast.error("Invalid birthdate format.");
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
      toast.success("Child profile updated successfully!");

      setChildren((prevChildren) =>
        prevChildren?.map((child) =>
          child.id === editingChildId ? data.child : child,
        ),
      );

      setEditingChildId(null);
      setChildToEdit(undefined);
      setLatestChildDataToEdit(undefined);
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

      toast.success(deletedChildData.message);
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
    <div className={styles.container}>
      <div className={styles.addBtn}>
        {isAdminAuthenticated ? (
          <RedirectButton
            linkURL={`/admins/customer-list/${customerId}/children-profiles/add-child`}
            btnText="Add Child"
            className="addBtn"
            Icon={PlusIcon}
          />
        ) : (
          <RedirectButton
            linkURL={`children-profiles/add-child`}
            btnText="Add Child"
            className="addBtn"
            Icon={PlusIcon}
          />
        )}
      </div>
      {children ? (
        <div className={styles.children}>
          {children.map((child) => (
            <div className={styles.childCard} key={child.id}>
              <div className={styles.childCard__profile}>
                {/* Child Name */}
                <div className={styles.childName}>
                  <div className={styles.childName__profileIconContainer}>
                    <UserCircleSolid
                      className={styles.childName__profileIcon}
                    />
                  </div>

                  <label className={styles.childName__label}>
                    <p className={styles.childName__text}>Name</p>

                    {editingChildId === child.id ? (
                      <div className={styles.childName__inputWrapper}>
                        <input
                          className={`${styles.childName__inputField} ${editingChildId === child.id ? styles.editable : ""}`}
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
                      </div>
                    ) : (
                      <div className={styles.childName__name}>
                        {childToEdit && childToEdit.id === child.id
                          ? childToEdit.name
                          : child.name}
                      </div>
                    )}
                  </label>
                </div>

                {/* Birthdate */}
                <div className={styles.birthdate}>
                  <label className={styles.birthdate__label}>
                    <p className={styles.birthdate__text}>Birthdate</p>

                    {editingChildId === child.id ? (
                      <div className={styles.birthdate__inputWrapper}>
                        <input
                          className={`${styles.birthdate__inputField} ${editingChildId === child.id ? styles.editable : ""}`}
                          type="date"
                          value={
                            childToEdit?.id === child.id
                              ? formatBirthdateToISO(childToEdit.birthdate)
                              : formatBirthdateToISO(child.birthdate)
                          }
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
                      </div>
                    ) : (
                      <div className={styles.profileInfo}>
                        <div className={styles.profileInfo__data}>
                          {childToEdit && childToEdit.id === child.id
                            ? formatBirthdateToISO(childToEdit.birthdate)
                            : formatBirthdateToISO(child.birthdate)}
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {/* Personal Info */}
                <div className={styles.personalInfo}>
                  <label className={styles.personalInfo__label}>
                    <p className={styles.personalInfo__text}>Notes</p>

                    {editingChildId === child.id ? (
                      <div className={styles.personalInfo__inputWrapper}>
                        <textarea
                          className={`${styles.personalInfo__inputField} ${styles.textarea} ${editingChildId === child.id ? styles.editable : ""}`}
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
                      </div>
                    ) : (
                      <div className={styles.profileInfo}>
                        <div className={styles.profileInfo__data}>
                          {childToEdit && childToEdit.id === child.id
                            ? childToEdit.personalInfo
                            : child.personalInfo}
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {editingChildId === child.id ? (
                <div className={styles.childCard__buttons}>
                  <ActionButton
                    className="cancelEditingChild"
                    btnText="Cancel"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancelClick();
                    }}
                  />

                  <ActionButton
                    className="saveChild"
                    btnText="Save"
                    type="button"
                    onClick={() => {
                      handleSaveClick();
                    }}
                  />
                </div>
              ) : (
                <div className={styles.childCard__buttons}>
                  <ActionButton
                    className="deleteChild"
                    btnText="Delete"
                    onClick={() => handleDeleteClick(child.id)}
                    disabled={editingChildId !== null}
                  />
                  <ActionButton
                    className="editChild"
                    btnText="Edit"
                    onClick={() => handleEditClick(child.id)}
                    disabled={editingChildId !== null}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.loadingContainer}>Loading ...</p>
      )}
    </div>
  );
}

export default ChildrenProfiles;
