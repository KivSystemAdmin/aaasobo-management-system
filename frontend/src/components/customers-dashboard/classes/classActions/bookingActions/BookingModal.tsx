"use client";

import Modal from "@/components/elements/modal/Modal";
import ProgressiveBookingFlow from "./ProgressiveBookingFlow";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  isFreeTrial: boolean;
  language: LanguageType;
  classCode?: string;
  childProfiles: Child[];
  customerId: number;
  adminId?: number;
  plan?: Plan;
  onBookingSuccess: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  classId,
  isFreeTrial,
  language,
  classCode,
  childProfiles,
  customerId,
  adminId,
  plan,
  onBookingSuccess,
}: BookingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="booking">
      <ProgressiveBookingFlow
        classId={classId}
        isFreeTrial={isFreeTrial}
        language={language}
        onClose={onClose}
        classCode={classCode}
        childProfiles={childProfiles}
        customerId={customerId}
        adminId={adminId}
        plan={plan}
        onBookingSuccess={onBookingSuccess}
      />
    </Modal>
  );
}
