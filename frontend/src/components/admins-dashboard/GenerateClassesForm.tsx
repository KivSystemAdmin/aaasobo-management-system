"use client";

import React, { useActionState, useMemo, useState } from "react";
import ActionButton from "../elements/buttons/actionButton/ActionButton";
import Modal from "../elements/modal/Modal";
import GenerateClassesModal from "./GenerateClassesModal";
import { generateClassesAction } from "@/app/actions/updateContent";

function GenerateClassesForm() {
  const initialFormState = {
    errorMessage: "",
    successMessage: "",
  };
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [generateClassesResultState, formAction] = useActionState(
    generateClassesAction,
    initialFormState,
  );
  const localState = useMemo(
    () => ({
      errorMessage: generateClassesResultState.errorMessage ?? "",
      successMessage: generateClassesResultState.successMessage ?? "",
    }),
    [generateClassesResultState],
  );

  return (
    <>
      <ActionButton
        btnText={"レギュラークラス生成"}
        className="generateClassesBtn"
        onClick={() => setIsModalOpen(true)}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        className="businessCalendarModal"
      >
        <form action={formAction}>
          <GenerateClassesModal
            error={localState.errorMessage}
            success={localState.successMessage}
          />
        </form>
      </Modal>
    </>
  );
}

export default GenerateClassesForm;
