"use client";

import { useEffect, useState } from "react";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import ActionButton from "../../elements/buttons/actionButton/ActionButton";
import {
  createInstructorFee,
  deleteLatestInstructorFee,
  getInstructorFees,
} from "@/lib/api/adminsApi";
import { confirmAlert, errorAlert } from "@/lib/utils/alertUtils";
import type { InstructorFeeRate } from "@shared/schemas/admins";
import styles from "./InstructorProfile.module.scss";

const DEFAULT_CURRENCY = "JPY";

const formatExclusiveEndDate = (value: string | null) => {
  if (!value) {
    return "Onwards";
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
};

const formatPeriod = (fee: InstructorFeeRate) =>
  `${fee.effectiveFrom} to ${formatExclusiveEndDate(fee.effectiveTo)}`;

const createFormState = (fee?: InstructorFeeRate | null) => ({
  currency: fee?.currency ?? DEFAULT_CURRENCY,
  effectiveFrom: "",
  trialFee: String(fee?.trialFee ?? 0),
  regularFee: String(fee?.regularFee ?? 0),
  cancelFee: String(fee?.cancelFee ?? 0),
  cancelWithoutNoticeFee: String(fee?.cancelWithoutNoticeFee ?? 0),
});

function FeeRateCard({
  fee,
  isLatest = false,
  onDelete,
  isDeleteDisabled = false,
}: {
  fee: InstructorFeeRate;
  isLatest?: boolean;
  onDelete?: () => void;
  isDeleteDisabled?: boolean;
}) {
  return (
    <article className={styles.feeCard}>
      <div className={styles.feeCardHeader}>
        <div>
          <strong>{formatPeriod(fee)}</strong>
        </div>
        <div className={styles.feeCardActions}>
          {isLatest && onDelete && (
            <ActionButton
              type="button"
              onClick={onDelete}
              btnText="Delete"
              className="deleteBtn"
              disabled={isDeleteDisabled}
            />
          )}
        </div>
      </div>
      <dl className={styles.feeGrid}>
        <div>
          <dt>Trial</dt>
          <dd>{formatMoney(fee.trialFee, fee.currency)}</dd>
        </div>
        <div>
          <dt>Regular</dt>
          <dd>{formatMoney(fee.regularFee, fee.currency)}</dd>
        </div>
        <div>
          <dt>Cancel</dt>
          <dd>{formatMoney(fee.cancelFee, fee.currency)}</dd>
        </div>
        <div>
          <dt>Cancel Without Notice</dt>
          <dd>{formatMoney(fee.cancelWithoutNoticeFee, fee.currency)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function InstructorFeeRates({
  instructorId,
}: {
  instructorId: number;
}) {
  const [fees, setFees] = useState<InstructorFeeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState(createFormState());

  const applyFees = (nextFees: InstructorFeeRate[]) => {
    setFees(nextFees);
    setFormState(createFormState(nextFees[0] ?? null));
  };

  const loadFees = async () => {
    setIsLoading(true);
    const response = await getInstructorFees(instructorId);
    if ("status" in response) {
      setIsLoading(false);
      await errorAlert(response.message);
      return;
    }

    applyFees(response.fees);
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    getInstructorFees(instructorId).then(async (response) => {
      if (!isMounted) {
        return;
      }

      if ("status" in response) {
        setIsLoading(false);
        await errorAlert(response.message);
        return;
      }

      applyFees(response.fees);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [instructorId]);

  const activeFee = fees.find((fee) => fee.effectiveTo === null) ?? fees[0];
  const historicalFees = activeFee
    ? fees.filter((fee) => fee.id !== activeFee.id)
    : [];

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    setFormState(createFormState(activeFee ?? null));
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setFormState(createFormState(activeFee ?? null));
    setIsFormOpen(false);
  };

  const handleCreateFee = async () => {
    const trialFee = Number(formState.trialFee);
    const regularFee = Number(formState.regularFee);
    const cancelFee = Number(formState.cancelFee);
    const cancelWithoutNoticeFee = Number(formState.cancelWithoutNoticeFee);

    if (
      !formState.effectiveFrom ||
      [trialFee, regularFee, cancelFee, cancelWithoutNoticeFee].some(
        (value) => !Number.isInteger(value) || value < 0,
      )
    ) {
      await errorAlert(
        "Enter an effective date and non-negative integer amounts for all fee fields.",
      );
      return;
    }

    setIsSubmitting(true);
    const response = await createInstructorFee(instructorId, {
      currency: formState.currency,
      effectiveFrom: formState.effectiveFrom,
      trialFee,
      regularFee,
      cancelFee,
      cancelWithoutNoticeFee,
    });
    setIsSubmitting(false);

    if ("status" in response) {
      await errorAlert(response.message);
      return;
    }

    toast.success(response.message);
    setIsFormOpen(false);
    await loadFees();
  };

  const handleDeleteLatest = async () => {
    if (!activeFee || fees.length < 2) {
      return;
    }

    const confirmed = await confirmAlert(
      `Delete the latest fee rate for ${formatPeriod(activeFee)}?<br /><br />This may change payroll results.`,
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    const response = await deleteLatestInstructorFee(instructorId);
    setIsSubmitting(false);

    if ("status" in response) {
      await errorAlert(response.message);
      return;
    }

    toast.success(response.message);
    await loadFees();
  };

  return (
    <div className={styles.insideContainer}>
      <BanknotesIcon className={styles.icon} />
      <div className={styles.userInfo}>
        <p>Fee Rates</p>
        <div className={styles.feeSection}>
          {isLoading ? (
            <p className={styles.feeMutedText}>Loading fee rates...</p>
          ) : activeFee ? (
            <FeeRateCard
              fee={activeFee}
              isLatest={true}
              onDelete={handleDeleteLatest}
              isDeleteDisabled={isSubmitting || fees.length < 2}
            />
          ) : (
            <p className={styles.feeMutedText}>No fee rates registered yet.</p>
          )}

          {isFormOpen && (
            <div className={styles.feeForm}>
              <h4 className={styles.feeFormTitle}>New fee rate</h4>
              <div className={styles.feeFormGrid}>
                <label>
                  Currency
                  <input
                    name="currency"
                    value={formState.currency}
                    onChange={handleFormChange}
                    maxLength={3}
                    placeholder="JPY"
                  />
                  <span className={styles.feeFieldHint}>
                    Use a 3-letter currency code, for example &quot;JPY&quot;.
                  </span>
                </label>
                <label>
                  Effective From
                  <input
                    type="date"
                    name="effectiveFrom"
                    value={formState.effectiveFrom}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  Trial Fee
                  <input
                    type="number"
                    name="trialFee"
                    min="0"
                    step="1"
                    value={formState.trialFee}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  Regular Fee
                  <input
                    type="number"
                    name="regularFee"
                    min="0"
                    step="1"
                    value={formState.regularFee}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  Cancel Fee
                  <input
                    type="number"
                    name="cancelFee"
                    min="0"
                    step="1"
                    value={formState.cancelFee}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  Cancel Without Notice Fee
                  <input
                    type="number"
                    name="cancelWithoutNoticeFee"
                    min="0"
                    step="1"
                    value={formState.cancelWithoutNoticeFee}
                    onChange={handleFormChange}
                  />
                </label>
              </div>
            </div>
          )}

          <div className={styles.feeActions}>
            {isFormOpen ? (
              <>
                <ActionButton
                  type="button"
                  onClick={handleCancelForm}
                  btnText="Cancel"
                  className="cancelBtn"
                  disabled={isSubmitting}
                />
                <ActionButton
                  type="button"
                  onClick={handleCreateFee}
                  btnText={isSubmitting ? "Saving..." : "Save"}
                  className="saveBtn"
                  disabled={isSubmitting}
                />
              </>
            ) : (
              <ActionButton
                type="button"
                onClick={handleOpenForm}
                btnText="Change fee rate"
                className="addBtn"
                disabled={isSubmitting}
              />
            )}
          </div>

          <details className={styles.feeHistory}>
            <summary>Rate history</summary>
            <div className={styles.feeHistoryList}>
              {historicalFees.length > 0 ? (
                historicalFees.map((fee) => (
                  <FeeRateCard key={fee.id} fee={fee} />
                ))
              ) : (
                <p className={styles.feeMutedText}>No past fee rates.</p>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
