import styles from "./InstructorSchedule.module.scss";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  getInstructorRecurringAvailability,
  addRecurringAvailabilities,
} from "@/app/helper/instructorsApi";
import { SlotsOfDays } from "@/app/helper/instructorsApi";
import ScheduleCalendar from "@/app/components/admins-dashboard/ScheduleCalendar";
import ActionButton from "@/app/components/ActionButton";

export default function InstructorSchedule({
  instructorId,
}: {
  instructorId: number;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [startFrom, setStartFrom] = useState(today);
  const [slots, setSlots] = useState<SlotsOfDays>({
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  });

  const fetchData = async () => {
    const instructor = await getInstructorRecurringAvailability(
      instructorId,
      selectedDate,
    );
    if ("message" in instructor) {
      alert(instructor.message);
      return;
    }
    setSlots(instructor.recurringAvailabilities);
  };

  useEffect(() => {
    fetchData();
  }, [instructorId, selectedDate]);

  const save = async () => {
    await addRecurringAvailabilities(instructorId, slots, startFrom);
    await fetchData();
    toast.success("Instructor schedule saved successfully.");
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.dateInput}>
        <label className={styles.label}>
          Display Schedule on
          <input
            className={styles.input}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </div>
      <ScheduleCalendar slotsOfDays={slots} setSlotsOfDays={setSlots} />
      <form className={styles.form}>
        <label className={styles.label}>
          Update Schedule from
          <input
            className={styles.input}
            type="date"
            value={startFrom}
            onChange={(e) => setStartFrom(e.target.value)}
          />
        </label>
        <div className={styles.actionBtn}>
          <ActionButton className="saveBtn" onClick={save} btnText="Save" />
        </div>
      </form>
    </>
  );
}
