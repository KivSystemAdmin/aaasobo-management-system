"use client";

import styles from "./ChildrenProfiles.module.scss";
import {
  PlusIcon,
  UserCircleIcon as UserCircleSolid,
} from "@heroicons/react/24/solid";
import { useCallback, useState } from "react";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import { formatBirthdateToISO } from "@/lib/utils/dateUtils";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  addChildProfileAction,
  updateChildProfileAction,
} from "@/app/actions/updateUser";
import InputField from "../../elements/inputField/InputField";
import { useFormMessages } from "@/hooks/useFormMessages";
import BirthdateInput from "../../features/registerForm/birthdateInput/BirthdateInput";
import TextAreaInput from "../../elements/textAreaInput/TextAreaInput";
import FormValidationMessage from "../../elements/formValidationMessage/FormValidationMessage";
import {
  CANNOT_DELETE_LAST_CHILD_PROFILE_MESSAGE,
  CONFIRM_DELETE_CHILD_PROFILE_MESSAGE,
} from "@/lib/messages/customerDashboard";
import { deleteChildProfileAction } from "@/app/actions/deleteUser";
import { MASKED_HEAD_LETTERS, MASKED_BIRTHDATE } from "@/lib/data/data";
import Modal from "../../elements/modal/Modal";
import AddChildForm from "./AddChildForm";
import { errorAlert, warningAlert, confirmAlert } from "@/lib/utils/alertUtils";

function ChildrenProfiles({
  customerId,
  childProfiles,
  userSessionType,
  terminationAt,
}: ChildrenProfilesProps) {
  const [updateResult, setUpdateResult] = useState<
    LocalizedMessages | undefined
  >(undefined);
  const [addResult, setAddResult] = useState<LocalizedMessages | undefined>(
    undefined,
  );
  const {
    localMessages: updateMessages,
    clearErrorMessage: clearUpdateErrorMessage,
    resetMessages: resetUpdateMessages,
  } = useFormMessages<LocalizedMessages>(updateResult);
  const {
    localMessages: addMessages,
    clearErrorMessage: clearAddErrorMessage,
    resetMessages: resetAddMessages,
  } = useFormMessages<LocalizedMessages>(addResult);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState<number | null>(null);
  const [editingSuccessChildId, setEditingSuccessChildId] = useState<
    number | null
  >(null);
  const handleBirthdateChange = useCallback(() => {
    clearUpdateErrorMessage("birthdate");
  }, [clearUpdateErrorMessage]);
  const { language } = useLanguage();
  const isError = !!updateMessages.errorMessage;
  const isSuccess = !!updateMessages.successMessage;

  const handleUpdateSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    resetUpdateMessages();
    const formData = new FormData(event.currentTarget);
    const result = await updateChildProfileAction(undefined, formData);
    setUpdateResult(result);
    if (result?.successMessage) {
      const submittedChildId = Number(formData.get("id"));
      setEditingSuccessChildId(
        Number.isNaN(submittedChildId) ? editingChildId : submittedChildId,
      );
      setEditingChildId(null);
    }
  };

  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetAddMessages();
    const formData = new FormData(event.currentTarget);
    const result = await addChildProfileAction(undefined, formData);
    setAddResult(result);
    if (result?.successMessage) {
      toast.success(result.successMessage[language]);
      setIsAddChildModalOpen(false);
      setAddResult(undefined);
    }
  };

  const handleAddChildClose = () => {
    setIsAddChildModalOpen(false);
    setAddResult(undefined);
    resetAddMessages();
  };

  const handleDeleteClick = async (childId: number) => {
    clearUpdateErrorMessage("all");
    const hasOnlyOneChild = childProfiles.length === 1;

    if (hasOnlyOneChild) {
      await warningAlert(CANNOT_DELETE_LAST_CHILD_PROFILE_MESSAGE[language]);
    }

    const confirmed = await confirmAlert(
      CONFIRM_DELETE_CHILD_PROFILE_MESSAGE[language],
    );
    if (!confirmed) return;

    const resultMessage = await deleteChildProfileAction(childId, customerId);

    if (resultMessage.successMessage) {
      toast.success(resultMessage.successMessage[language]);
    } else if (resultMessage.errorMessage) {
      errorAlert(resultMessage.errorMessage[language]);
    }
  };

  return (
    <div className={styles.container}>
      {!terminationAt && (
        <div className={styles.addBtn}>
          <ActionButton
            btnText={language === "ja" ? "お子さまを追加" : "Add Child"}
            className="addBtn"
            Icon={PlusIcon}
            onClick={(e) => {
              e.preventDefault();
              setEditingChildId(null);
              clearUpdateErrorMessage("all");
              clearAddErrorMessage("all");
              setIsAddChildModalOpen(true);
            }}
          />
        </div>
      )}

      <Modal
        isOpen={isAddChildModalOpen}
        onClose={handleAddChildClose}
        className="rebooking"
      >
        <AddChildForm
          language={language}
          onSubmit={handleAddSubmit}
          customerId={customerId}
          localMessages={addMessages}
          userSessionType={userSessionType}
          isError={!!addMessages.errorMessage}
          clearErrorMessage={clearAddErrorMessage}
        />
      </Modal>

      <div className={styles.children}>
        {childProfiles.map((child) => (
          <form
            className={styles.childCard}
            key={child.id}
            onSubmit={handleUpdateSubmit}
          >
            <div className={styles.childCard__profile}>
              {/* Child Name */}
              <div className={styles.childName}>
                <div className={styles.childName__profileIconContainer}>
                  <UserCircleSolid className={styles.childName__profileIcon} />
                </div>

                <label className={styles.childName__label}>
                  <p className={styles.childName__text}>
                    {language === "ja" ? "名前" : "Name"}
                  </p>

                  {editingChildId === child.id ? (
                    <InputField
                      name="name"
                      type="text"
                      placeholder={
                        language === "ja"
                          ? "お子さまのお名前(ローマ字で)"
                          : "Child's name (in English)"
                      }
                      defaultValue={child.name}
                      className={styles.childName__inputField}
                      onChange={() => clearUpdateErrorMessage("name")}
                      error={updateMessages.name?.[language]}
                    />
                  ) : (
                    <div className={styles.childName__name}>{child.name}</div>
                  )}
                </label>
              </div>

              {/* Birthdate */}
              <div className={styles.birthdate}>
                <label className={styles.birthdate__label}>
                  <p className={styles.birthdate__text}>
                    {language === "ja" ? "生年月日" : "Date of birth"}
                  </p>

                  {editingChildId === child.id ? (
                    <BirthdateInput
                      onValidDateChange={handleBirthdateChange}
                      defaultBirthdate={formatBirthdateToISO(child.birthdate)}
                      error={updateMessages.birthdate?.[language]}
                      language={language}
                      useFormAction={true}
                    />
                  ) : (
                    <div className={styles.profileInfo}>
                      <div className={styles.profileInfo__data}>
                        {formatBirthdateToISO(child.birthdate).includes(
                          MASKED_BIRTHDATE,
                        )
                          ? MASKED_HEAD_LETTERS
                          : formatBirthdateToISO(child.birthdate)}
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* Personal Info */}
              <div className={styles.personalInfo}>
                <label className={styles.personalInfo__label}>
                  <p className={styles.personalInfo__text}>
                    {language === "ja" ? "プロフィール" : "Profile"}
                  </p>

                  {editingChildId === child.id ? (
                    <TextAreaInput
                      defaultValue={child.personalInfo ?? undefined}
                      placeholder={
                        language === "ja"
                          ? "例. 5 years old, Beginner, Car, Peppapig"
                          : "e.g., 5 years old, Beginner, Car, Peppapig"
                      }
                      error={updateMessages.personalInfo?.[language]}
                      onChange={(e) => {
                        clearUpdateErrorMessage("personalInfo");
                      }}
                      required
                      language={language}
                      name="personalInfo"
                      className="childProfile"
                    />
                  ) : (
                    <div className={styles.profileInfo}>
                      <div className={styles.profileInfo__data}>
                        {child.personalInfo}
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className={styles.messageWrapper}>
              {((isError && child.id === editingChildId) ||
                (isSuccess && child.id === editingSuccessChildId)) && (
                <FormValidationMessage
                  type={isError ? "error" : "success"}
                  message={
                    isError
                      ? updateMessages.errorMessage[language]
                      : updateMessages.successMessage[language]
                  }
                />
              )}
            </div>

            {!terminationAt && (
              <>
                {editingChildId === child.id ? (
                  <div className={styles.childCard__buttons}>
                    <ActionButton
                      className="cancelEditingCustomer"
                      btnText={language === "ja" ? "キャンセル" : "Cancel"}
                      onClick={(e) => {
                        e.preventDefault();
                        clearUpdateErrorMessage("all");
                        setEditingChildId(null);
                      }}
                    />
                    <ActionButton
                      className="saveCustomer"
                      btnText={language === "ja" ? "変更を保存" : "Save"}
                      type="submit"
                    />
                  </div>
                ) : (
                  <div className={styles.childCard__buttons}>
                    <ActionButton
                      className="deleteChild"
                      btnText={language === "ja" ? "削除" : "Delete"}
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteClick(child.id);
                      }}
                      disabled={editingChildId !== null}
                    />
                    <ActionButton
                      className="editChild"
                      btnText={language === "ja" ? "編集" : "Edit"}
                      onClick={() => {
                        clearUpdateErrorMessage("all");
                        setEditingChildId(child.id);
                        setEditingSuccessChildId(null);
                      }}
                      disabled={editingChildId !== null}
                    />
                  </div>
                )}
              </>
            )}

            {/* Hidden fields to include in form submission */}
            {/* For security, pass the customer ID through a hidden input only if the admin is authenticated */}
            {userSessionType === "admin" && (
              <input type="hidden" name="customerId" value={customerId ?? ""} />
            )}
            <input type="hidden" name="id" value={child.id ?? ""} />
          </form>
        ))}
      </div>
    </div>
  );
}

export default ChildrenProfiles;
