"use client";

import styles from "./PlanProfile.module.scss";
import { toast } from "react-toastify";
import { useState, useCallback } from "react";
import { updatePlanAction } from "@/app/actions/updateContent";
import { deletePlanAction } from "@/app/actions/deleteContent";
import InputField from "../../elements/inputField/InputField";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import RadioButton from "../../elements/radioButton/RadioButton";
import {
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/components/elements/loading/Loading";
import {
  CONTENT_UPDATE_SUCCESS_MESSAGE,
  CONTENT_DELETE_SUCCESS_MESSAGE,
} from "@/lib/messages/formValidation";
import { confirmAlert } from "@/lib/utils/alertUtils";
import { getLocalizedText } from "@/lib/utils/stringUtils";
import { EnglishBackground } from "@/types";
import { ENGLISH_BACKGROUND_LABELS } from "@/lib/data/englishBackground";

function PlanProfile({
  plan,
  userSessionType,
}: {
  plan: Plan | string;
  userSessionType?: UserType;
}) {
  // Use `useFormState` hook for updating an plan profile
  const [updateResultState, setUpdateResultState] = useState<
    UpdateFormState | undefined
  >(undefined);
  // Use `useState` hook and FormData for deleting an plan profile
  const [deleteResultState, setDeleteResultState] = useState<DeleteFormState>(
    {},
  );
  const [previousPlan, setPreviousPlan] = useState<Plan | null>(
    typeof plan !== "string"
      ? {
          ...plan,
          planNameEng: getLocalizedText(plan.name, "en"),
          planNameJpn: getLocalizedText(plan.name, "ja"),
        }
      : null,
  );
  const [latestPlan, setLatestPlan] = useState<Plan | null>(
    typeof plan !== "string"
      ? {
          ...plan,
          planNameEng: getLocalizedText(plan.name, "en"),
          planNameJpn: getLocalizedText(plan.name, "ja"),
        }
      : null,
  );
  const [isEditing, setIsEditing] = useState(false);
  // Handle form messages manually for UpdateFormState
  const [localMessages, setLocalMessages] = useState<Record<string, string>>(
    {},
  );

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = async () => {
    const confirmed = await confirmAlert(
      "Are you sure you want to delete this plan?",
    );

    if (confirmed && latestPlan) {
      const formData = new FormData();
      formData.append("id", String(latestPlan.id));

      const result = await deletePlanAction(deleteResultState, formData);
      setDeleteResultState(result);
      if ("id" in result && result.id) {
        toast.success(CONTENT_DELETE_SUCCESS_MESSAGE("plan"));
        setIsEditing(false);
        setPreviousPlan(null);
        setLatestPlan(null);
      } else if ("errorMessage" in result && result.errorMessage) {
        toast.error(result.errorMessage);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Plan,
  ) => {
    if (latestPlan) {
      setLatestPlan({ ...latestPlan, [field]: e.target.value });
    }
  };

  // Handle radio button change for englishBackground
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLatestPlan({
      ...latestPlan,
      englishBackground: Number(e.target.value),
    } as Plan);
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

  const handleCancelClick = () => {
    if (latestPlan) {
      setLatestPlan(previousPlan);
      setIsEditing(false);
      clearErrorMessage("planNameJpn");
      clearErrorMessage("planNameEng");
      clearErrorMessage("description");
    }
  };

  const buildLocalMessages = (result: UpdateFormState | undefined) => {
    if (!result) {
      return {};
    }
    const newMessages: Record<string, string> = {};
    if (result.planNameJpn) newMessages.planNameJpn = result.planNameJpn;
    if (result.planNameEng) newMessages.planNameEng = result.planNameEng;
    if (result.description) newMessages.description = result.description;
    if (result.errorMessage) newMessages.errorMessage = result.errorMessage;
    return newMessages;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await updatePlanAction(undefined, formData);
    setUpdateResultState(result);
    setLocalMessages(buildLocalMessages(result));

    if ("plan" in result && result.plan) {
      const updatedPlan = result.plan as Plan;
      toast.success(CONTENT_UPDATE_SUCCESS_MESSAGE("plan"));
      setIsEditing(false);
      setPreviousPlan({
        ...updatedPlan,
        planNameEng: getLocalizedText(updatedPlan.name, "en"),
        planNameJpn: getLocalizedText(updatedPlan.name, "ja"),
      });
      setLatestPlan({
        ...updatedPlan,
        planNameEng: getLocalizedText(updatedPlan.name, "en"),
        planNameJpn: getLocalizedText(updatedPlan.name, "ja"),
      });
    } else if ("errorMessage" in result && result.errorMessage) {
      toast.error(result.errorMessage);
    }
  };

  if (typeof plan === "string") {
    return <p>{plan}</p>;
  }

  if (!latestPlan) {
    return <p>Plan not found</p>;
  }

  return (
    <>
      <div className={styles.container}>
        {latestPlan ? (
          <form onSubmit={handleSubmit} className={styles.profileCard}>
            <div className={styles.profileCard}>
              {/* Plan name */}
              <div className={styles.planName__nameSection}>
                {isEditing ? (
                  <div>
                    <p className={styles.planName__text}>
                      Plan Name (Japanese)
                    </p>
                    <InputField
                      name="planNameJpn"
                      value={latestPlan.planNameJpn}
                      onChange={(e) => handleInputChange(e, "planNameJpn")}
                      error={localMessages.planNameJpn}
                      className={`${styles.planName__inputField} ${isEditing ? styles.editable : ""}`}
                    />
                    <p className={styles.planName__text}>Plan Name (English)</p>
                    <InputField
                      name="planNameEng"
                      value={latestPlan.planNameEng}
                      onChange={(e) => handleInputChange(e, "planNameEng")}
                      error={localMessages.planNameEng}
                      className={`${styles.planName__inputField} ${isEditing ? styles.editable : ""}`}
                    />
                  </div>
                ) : (
                  <h3 className={styles.planName__name}>{latestPlan.name}</h3>
                )}
              </div>

              {/* Weekly class times */}
              <div className={styles.insideContainer}>
                <CalendarIcon className={styles.icon} />
                <div>
                  {isEditing ? (
                    <>
                      <p>
                        Weekly class times{" "}
                        <span className={styles.weeklyClassTimes__redText}>
                          (Uneditable)
                        </span>
                      </p>
                      <InputField
                        name="weeklyClassTimes"
                        type="number"
                        value={String(latestPlan.weeklyClassTimes)}
                        onChange={(e) =>
                          handleInputChange(e, "weeklyClassTimes")
                        }
                        className={`${styles.weeklyClassTimes__inputField} ${isEditing ? styles.editable : ""}`}
                        readOnly
                      />
                    </>
                  ) : (
                    <>
                      <p>Weekly class times</p>
                      <h4 className={styles.weeklyClassTimes__text}>
                        {latestPlan.weeklyClassTimes}
                      </h4>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className={styles.insideContainer}>
                <PencilIcon className={styles.icon} />
                <div>
                  <p className={styles.planName__text}>Description</p>
                  {isEditing ? (
                    <InputField
                      name="description"
                      value={latestPlan.description}
                      onChange={(e) => handleInputChange(e, "description")}
                      error={localMessages.description}
                      className={`${styles.planDescription__inputField} ${isEditing ? styles.editable : ""}`}
                    />
                  ) : (
                    <h4 className={styles.planDescription__text}>
                      {latestPlan.description}
                    </h4>
                  )}
                </div>
              </div>

              {/* Plan Type (Radio button) */}
              <div className={styles.insideContainer}>
                <AcademicCapIcon className={styles.icon} />
                <div>
                  <p className={styles.planName__text}>Plan Type</p>
                  {isEditing ? (
                    <>
                      <RadioButton
                        name="englishBackground"
                        value={EnglishBackground.NonNative}
                        checked={
                          latestPlan.englishBackground ===
                          EnglishBackground.NonNative
                        }
                        onChange={handleRadioChange}
                        label={
                          ENGLISH_BACKGROUND_LABELS[EnglishBackground.NonNative]
                        }
                        className={styles.planTypeRadio}
                      />
                      <RadioButton
                        name="englishBackground"
                        value={EnglishBackground.NativeA}
                        checked={
                          latestPlan.englishBackground ===
                          EnglishBackground.NativeA
                        }
                        onChange={handleRadioChange}
                        label={
                          ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeA]
                        }
                        className={styles.planTypeRadio}
                      />
                      <RadioButton
                        name="englishBackground"
                        value={EnglishBackground.NativeB}
                        checked={
                          latestPlan.englishBackground ===
                          EnglishBackground.NativeB
                        }
                        onChange={handleRadioChange}
                        label={
                          ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeB]
                        }
                        className={styles.planTypeRadio}
                      />
                    </>
                  ) : (
                    <h4 className={styles.planDescription__text}>
                      {
                        ENGLISH_BACKGROUND_LABELS[
                          latestPlan.englishBackground as EnglishBackground
                        ]
                      }
                    </h4>
                  )}
                </div>
              </div>

              {/* Hidden input field */}
              <input type="hidden" name="planId" value={latestPlan.id} />

              {/* Action buttons for only admin */}
              {userSessionType === "admin" ? (
                <>
                  {isEditing ? (
                    <div className={styles.buttons}>
                      <ActionButton
                        className="cancelEditingPlan"
                        btnText="Cancel"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleCancelClick();
                        }}
                      />
                      <ActionButton
                        className="savePlan"
                        btnText="Save"
                        type="submit"
                        Icon={CheckIcon}
                      />
                    </div>
                  ) : (
                    <div className={styles.buttons}>
                      <div>
                        <ActionButton
                          className="deletePlan"
                          btnText="Delete"
                          type="button"
                          onClick={handleDeleteClick}
                        />
                      </div>
                      <div>
                        <ActionButton
                          className="editPlan"
                          btnText="Edit"
                          type="button"
                          onClick={handleEditClick}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </form>
        ) : (
          <Loading />
        )}
      </div>
    </>
  );
}

export default PlanProfile;
