"use client";

import styles from "./EventProfile.module.scss";
import { useState, useCallback } from "react";
import { updateEventAction } from "@/app/actions/updateContent";
import { deleteEventAction } from "@/app/actions/deleteContent";
import {
  CONTENT_UPDATE_SUCCESS_MESSAGE,
  CONTENT_DELETE_SUCCESS_MESSAGE,
} from "@/lib/messages/formValidation";
import InputField from "../../elements/inputField/InputField";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import { PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { getLocalizedText } from "@/lib/utils/stringUtils";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/components/elements/loading/Loading";
import { confirmAlert } from "@/lib/utils/alertUtils";

const protectedDefaultEventNames = new Set([
  "お休み / No Class",
  "お休み振替対象日 / No Class (Rebookable)",
]);

function EventProfile({
  event,
  userSessionType,
}: {
  event: BusinessEventType | string;
  userSessionType: UserType;
}) {
  // Use `useFormState` hook for updating an event profile
  const [updateResultState, setUpdateResultState] = useState<
    UpdateFormState | undefined
  >(undefined);
  // Use `useState` hook and FormData for deleting an event profile
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
    if (result.eventNameJpn) newMessages.eventNameJpn = result.eventNameJpn;
    if (result.eventNameEng) newMessages.eventNameEng = result.eventNameEng;
    if (result.color) newMessages.color = result.color;
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
  const [previousEvent, setPreviousEvent] = useState<BusinessEventType | null>(
    typeof event !== "string"
      ? {
          ...event,
          eventNameEng: getLocalizedText(event.name, "en"),
          eventNameJpn: getLocalizedText(event.name, "ja"),
        }
      : null,
  );
  const [latestEvent, setLatestEvent] = useState<BusinessEventType | null>(
    typeof event !== "string"
      ? {
          ...event,
          eventNameEng: getLocalizedText(event.name, "en"),
          eventNameJpn: getLocalizedText(event.name, "ja"),
        }
      : null,
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof BusinessEventType,
  ) => {
    if (latestEvent) {
      setLatestEvent({ ...latestEvent, [field]: e.target.value });
    }
  };

  const handleCancelClick = () => {
    if (latestEvent) {
      setLatestEvent(previousEvent);
      setIsEditing(false);
      clearErrorMessage("eventNameJpn");
      clearErrorMessage("eventNameEng");
      clearErrorMessage("color");
    }
  };

  const handleDeleteClick = async () => {
    const confirmed = await confirmAlert(
      "Are you sure you want to delete this event?",
    );

    if (confirmed && latestEvent) {
      const formData = new FormData();
      formData.append("id", String(latestEvent.id));

      const result = await deleteEventAction(deleteResultState, formData);
      setDeleteResultState(result);
      if ("id" in result && result.id) {
        toast.success(CONTENT_DELETE_SUCCESS_MESSAGE("event"));
        setIsEditing(false);
        setLatestEvent(null);
      } else if ("errorMessage" in result && result.errorMessage) {
        toast.error(result.errorMessage);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await updateEventAction(undefined, formData);
    setUpdateResultState(result);
    setLocalMessages(buildLocalMessages(result));

    if ("event" in result && result.event) {
      const updatedEvent = result.event as BusinessEventType;
      toast.success(CONTENT_UPDATE_SUCCESS_MESSAGE("event"));
      setIsEditing(false);
      setPreviousEvent({
        ...updatedEvent,
        eventNameEng: getLocalizedText(updatedEvent.name, "en"),
        eventNameJpn: getLocalizedText(updatedEvent.name, "ja"),
      });
      setLatestEvent({
        ...updatedEvent,
        eventNameEng: getLocalizedText(updatedEvent.name, "en"),
        eventNameJpn: getLocalizedText(updatedEvent.name, "ja"),
      });
    } else if ("errorMessage" in result && result.errorMessage) {
      toast.error(result.errorMessage);
    }
  };

  if (typeof event === "string") {
    return <p>{event}</p>;
  }

  const isEventDisabled = protectedDefaultEventNames.has(event.name);

  return (
    <>
      <div className={styles.container}>
        {latestEvent && latestEvent.color ? (
          <form onSubmit={handleSubmit} className={styles.profileCard}>
            <div className={styles.profileCard}>
              {/* Event name */}
              <div className={styles.eventName__nameSection}>
                {isEditing ? (
                  <div>
                    <p className={styles.eventName__text}>
                      Event Name (Japanese)
                    </p>
                    <InputField
                      name="eventNameJpn"
                      value={latestEvent.eventNameJpn}
                      error={localMessages.eventNameJpn}
                      onChange={(e) => handleInputChange(e, "eventNameJpn")}
                      className={`${styles.eventName__inputField} ${isEditing ? styles.editable : ""}`}
                    />
                    <p className={styles.eventName__text}>
                      Event Name (English)
                    </p>
                    <InputField
                      name="eventNameEng"
                      value={latestEvent.eventNameEng}
                      error={localMessages.eventNameEng}
                      onChange={(e) => handleInputChange(e, "eventNameEng")}
                      className={`${styles.eventName__inputField} ${isEditing ? styles.editable : ""}`}
                    />
                  </div>
                ) : (
                  <h3 className={styles.eventName__name}>{latestEvent.name}</h3>
                )}
              </div>

              {/* Color */}
              <div className={styles.insideContainer}>
                <PencilIcon className={styles.icon} />
                <div>
                  <p className={styles.eventName__text}>Color</p>
                  {isEditing ? (
                    <div className={styles.eventColor}>
                      <InputField
                        name="color"
                        type="color"
                        value={latestEvent.color.toUpperCase()}
                        error={localMessages.color}
                        onChange={(e) => handleInputChange(e, "color")}
                        className={`${styles.eventColor__inputField} ${isEditing ? styles.editable : ""}`}
                      />
                      <div className={styles.eventColor__editText}>
                        {latestEvent.color.toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.eventColor}>
                      <div
                        className={styles.eventColor__colorBox}
                        style={{
                          backgroundColor: latestEvent.color,
                        }}
                      />
                      <h3 className={styles.eventColor__displayText}>
                        {latestEvent.color.toUpperCase()}
                      </h3>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden input field */}
              <input type="hidden" name="eventId" value={latestEvent.id} />

              {/* Action buttons for only admin */}
              {userSessionType === "admin" ? (
                <>
                  {isEditing ? (
                    <div className={styles.buttons}>
                      <ActionButton
                        className="cancelEditingEvent"
                        btnText="Cancel"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleCancelClick();
                        }}
                      />
                      <ActionButton
                        className="saveEvent"
                        btnText="Save"
                        type="submit"
                        Icon={CheckIcon}
                      />
                    </div>
                  ) : (
                    <div className={styles.buttons}>
                      <div>
                        <ActionButton
                          className="deleteEvent"
                          btnText="Delete"
                          type="button"
                          onClick={() => handleDeleteClick()}
                          disabled={isEventDisabled}
                        />
                      </div>
                      <div>
                        <ActionButton
                          className="editEvent"
                          btnText="Edit"
                          type="button"
                          onClick={handleEditClick}
                          disabled={isEventDisabled}
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

export default EventProfile;
