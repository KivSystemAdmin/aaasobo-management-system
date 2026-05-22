"use client";

import { ChangeEvent, useMemo, useState } from "react";
import styles from "./GenerateClassesModal.module.scss";
import ActionButton from "../elements/buttons/actionButton/ActionButton";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import FormValidationMessage from "../elements/formValidationMessage/FormValidationMessage";

type GenerateClassesModalProps = {
  error?: string;
  success?: string;
};

function GenerateClassesModal({ error, success }: GenerateClassesModalProps) {
  const defaultValue = "Select Month";
  const [selectedMonth, setSelectedMonth] = useState(defaultValue);
  const isSelectMonth = selectedMonth === "" || selectedMonth === defaultValue;

  const selectableMonths = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = date.toLocaleString("default", {
        year: "numeric",
        month: "long",
      });
      months.push(value);
    }

    return months;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  return (
    <div className={styles.modalContent}>
      <h2>Generate Classes</h2>
      <div className={styles.dateInfo}>
        <label htmlFor="yearMonth">
          <CalendarDaysIcon className={styles.icon} />
        </label>
        <select
          id="yearMonth"
          name="yearMonth"
          value={selectedMonth}
          onChange={handleChange}
          style={{ color: isSelectMonth ? "gray" : "black" }}
        >
          <option value={defaultValue} className={styles.grayOption} disabled>
            {defaultValue}
          </option>
          {selectableMonths.map((month, index) => (
            <option key={index} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>
      {error && <FormValidationMessage type="error" message={error} />}
      {success && <FormValidationMessage type="success" message={success} />}
      <div className={styles.actionButton}>
        <ActionButton className="bookBtn" btnText="Generate" type="submit" />
      </div>
    </div>
  );
}

export default GenerateClassesModal;
