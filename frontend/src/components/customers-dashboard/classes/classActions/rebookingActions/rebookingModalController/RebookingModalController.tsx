"use client";

import Modal from "@/components/elements/modal/Modal";
import { useState } from "react";
import ActionButton from "@/components/elements/buttons/actionButton/ActionButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { CHILD_PROFILE_REQUIRED_MESSAGE } from "@/lib/messages/customerDashboard";
import { errorAlert } from "@/lib/utils/alertUtils";

export default function RebookingModalController({
  rebookableClasses,
  hasChildProfile,
  userSessionType,
  terminationAt,
  modalContent,
}: RebookingModalControllerProps) {
  const { language } = useLanguage();
  const [isRebookingModalOpen, setIsRebookingModalOpen] = useState(false);
  const rebookableClassesNumber = rebookableClasses.length;

  const handleRebookingClick = () => {
    if (!hasChildProfile)
      return errorAlert(CHILD_PROFILE_REQUIRED_MESSAGE[language]);
    setIsRebookingModalOpen(true);
  };

  const buttonText =
    language === "ja"
      ? `クラスを予約 (${rebookableClassesNumber})`
      : `Book Class (${rebookableClassesNumber})`;

  return (
    <>
      {userSessionType === "admin" || !terminationAt ? (
        <ActionButton
          btnText={buttonText}
          className="rebookClass"
          onClick={handleRebookingClick}
          disabled={rebookableClassesNumber === 0}
        />
      ) : null}
      <Modal
        isOpen={isRebookingModalOpen}
        onClose={() => setIsRebookingModalOpen(false)}
        className="rebooking"
      >
        {modalContent}
      </Modal>
    </>
  );
}
