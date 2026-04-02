"use client";

import styles from "./AdminProfile.module.scss";
import { useState, useCallback } from "react";
import { updateAdminAction } from "@/app/actions/updateUser";
import { deleteAdminAction } from "@/app/actions/deleteUser";
import {
  ADMIN_UPDATE_SUCCESS_MESSAGE,
  ADMIN_DELETE_SUCCESS_MESSAGE,
} from "@/lib/messages/formValidation";
import InputField from "../elements/inputField/InputField";
import ActionButton from "../elements/buttons/actionButton/ActionButton";
import { SUPER_ADMIN_ID } from "@/lib/data/data";
import { CheckIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/components/elements/loading/Loading";
import { confirmAlert } from "@/lib/utils/alertUtils";

function AdminProfile({
  userId,
  admin,
  userSessionType,
}: {
  userId: number;
  admin: Admin | string;
  userSessionType: UserType;
}) {
  // Use `useFormState` hook for updating an admin profile
  const [updateResultState, setUpdateResultState] = useState<
    UpdateFormState | undefined
  >(undefined);
  // Use `useState` hook and FormData for deleting an admin profile
  const [deleteResultState, setDeleteResultState] = useState<DeleteFormState>(
    {},
  );
  // Handle form messages manually for UpdateFormState
  const [localMessages, setLocalMessages] = useState<Record<string, string>>(
    {},
  );

  const buildLocalMessages = (result: UpdateFormState | undefined) => {
    if (!result) {
      return {};
    }
    const newMessages: Record<string, string> = {};
    if (result.name) newMessages.name = result.name;
    if (result.email) newMessages.email = result.email;
    if (result.errorMessage) newMessages.errorMessage = result.errorMessage;
    return newMessages;
  };

  const clearErrorMessage = useCallback((field: string) => {
    setLocalMessages((prev) => {
      if (field === "all") {
        return {};
      }
      const updatedMessages = { ...prev };
      delete updatedMessages[field];
      delete updatedMessages.errorMessage;
      return updatedMessages;
    });
  }, []);
  const [previousAdmin, setPreviousAdmin] = useState<Admin | null>(
    typeof admin !== "string" ? admin : null,
  );
  const [latestAdmin, setLatestAdmin] = useState<Admin | null>(
    typeof admin !== "string" ? admin : null,
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Admin & string,
  ) => {
    if (latestAdmin) {
      setLatestAdmin({ ...latestAdmin, [field]: e.target.value });
      clearErrorMessage(field);
    }
  };

  const handleCancelClick = () => {
    if (latestAdmin) {
      setLatestAdmin(previousAdmin);
      setIsEditing(false);
      clearErrorMessage("email");
    }
  };

  const handleDeleteClick = async () => {
    const confirmed = await confirmAlert(
      "Are you sure you want to delete this admin's profile?",
    );
    if (confirmed && latestAdmin) {
      const formData = new FormData();
      formData.append("id", String(latestAdmin.id));

      const result = await deleteAdminAction(deleteResultState, formData);
      setDeleteResultState(result);
      if ("id" in result && result.id) {
        toast.success(ADMIN_DELETE_SUCCESS_MESSAGE);
        setIsEditing(false);
        setLatestAdmin(null);
      } else if ("errorMessage" in result && result.errorMessage) {
        toast.error(result.errorMessage);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await updateAdminAction(undefined, formData);
    setUpdateResultState(result);
    setLocalMessages(buildLocalMessages(result));

    if ("admin" in result && result.admin) {
      const admin = result.admin as Admin;
      toast.success(ADMIN_UPDATE_SUCCESS_MESSAGE);
      setIsEditing(false);
      setPreviousAdmin(admin);
      setLatestAdmin(admin);
    } else if ("errorMessage" in result && result.errorMessage) {
      toast.error(result.errorMessage);
    }
  };

  // Error message is displayed if the admin data is not found.
  if (typeof admin === "string") {
    return <p>{admin}</p>;
  }

  if (!latestAdmin) {
    return <p>Admin not found</p>;
  }

  const adminId = admin.id;

  return (
    <>
      <div className={styles.container}>
        {latestAdmin ? (
          <form onSubmit={handleSubmit} className={styles.profileCard}>
            {/* Admin name */}
            <div className={styles.adminName__nameSection}>
              <p className={styles.adminName__text}>Name</p>
              {isEditing ? (
                <InputField
                  name="name"
                  value={latestAdmin.name}
                  onChange={(e) => handleInputChange(e, "name")}
                  className={`${styles.adminName__inputField} ${isEditing ? styles.editable : ""}`}
                />
              ) : (
                <h3 className={styles.adminName__name}>{latestAdmin.name}</h3>
              )}
            </div>

            {/* Admin email */}
            <div className={styles.insideContainer}>
              <EnvelopeIcon className={styles.icon} />
              <div>
                <p>Email</p>
                {isEditing ? (
                  <InputField
                    name="email"
                    type="email"
                    value={latestAdmin.email}
                    error={localMessages.email}
                    onChange={(e) => handleInputChange(e, "email")}
                    className={`${styles.email__inputField} ${isEditing ? styles.editable : ""}`}
                  />
                ) : (
                  <h4 className={styles.email__text}>{latestAdmin.email}</h4>
                )}
              </div>
            </div>

            {/* Hidden input field */}
            <input type="hidden" name="id" value={latestAdmin.id} />

            {/* Action buttons for only admin */}
            {userSessionType === "admin" &&
              (isEditing ? (
                <div className={styles.buttons}>
                  <ActionButton
                    className="cancelEditingAdmin"
                    btnText="Cancel"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCancelClick();
                    }}
                  />
                  <ActionButton
                    className="saveAdmin"
                    btnText="Save"
                    type="submit"
                    Icon={CheckIcon}
                  />
                </div>
              ) : (
                <div className={styles.buttons}>
                  <div>
                    <ActionButton
                      className="deleteAdmin"
                      btnText="Delete"
                      type="button"
                      onClick={() => handleDeleteClick()}
                      disabled={userId === adminId && userId === SUPER_ADMIN_ID}
                    />
                  </div>
                  <div>
                    <ActionButton
                      className="editAdmin"
                      btnText="Edit"
                      type="button"
                      onClick={handleEditClick}
                    />
                  </div>
                </div>
              ))}
          </form>
        ) : (
          <Loading />
        )}
      </div>
    </>
  );
}

export default AdminProfile;
