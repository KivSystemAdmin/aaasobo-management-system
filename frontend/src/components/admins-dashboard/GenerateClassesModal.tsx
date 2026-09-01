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
  const defaultValue = "";
  const [selectedMonth, setSelectedMonth] = useState(defaultValue);
  const isSelectMonth = selectedMonth === defaultValue;

  const selectableMonths = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
      });
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      months.push({ value, label });
    }

    return months;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  return (
    <div className={styles.modalContent}>
      <h2>レギュラークラスを生成</h2>
      <p className={styles.description}>
        選択した月の有効なレギュラークラス設定をもとに、各開催日のクラスを一括生成します。
      </p>
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
            対象月を選択
          </option>
          {selectableMonths.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>
      {error && <FormValidationMessage type="error" message={error} />}
      {success && <FormValidationMessage type="success" message={success} />}
      <div className={styles.actionButton}>
        <ActionButton className="bookBtn" btnText="生成する" type="submit" />
      </div>
    </div>
  );
}

export default GenerateClassesModal;
