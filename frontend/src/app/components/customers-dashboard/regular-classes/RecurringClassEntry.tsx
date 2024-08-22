"use client";

import { formatTime, getWeekday } from "@/app/helper/dateUtils";
import {
  Day,
  fetchInstructorRecurringAvailabilities,
  SlotsOfDays,
} from "@/app/helper/instructorsApi";
import { getRecurringClassesByInstructorId } from "@/app/helper/recurringClassesApi";
import { useEffect, useState } from "react";
import styles from "./RecurringClassEntry.module.scss";
import ActionButton from "../../ActionButton";
import Loading from "../../Loading";

function RecurringClassEntry({
  state,
  setState,
  instructorsData,
  childList,
  index,
  onClickHandler,
}: {
  state: RecurringClassState;
  setState: (state: RecurringClassState) => void;
  instructorsData: Instructor[];
  childList: Child[];
  index: number;
  onClickHandler: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    state: RecurringClassState,
    startDate: string,
  ) => void;
}) {
  const emptySlots = {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  };
  const { day, time, instructorId, childrenIds } = state;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<SlotsOfDays>(emptySlots);
  const [times, setTimes] = useState<string[]>([]);

  // Get tomorrow's date
  // TODO: Tomorrow needs to be fixed.
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split("T")[0];

  useEffect(() => {
    if (!instructorId) return;
    const getRecurringAvailabilities = async () => {
      try {
        // Set unavailable recurring classes to the slots
        const recurringClassesData =
          await getRecurringClassesByInstructorId(instructorId);
        const newUnavailableSlots: SlotsOfDays = {
          Mon: [],
          Tue: [],
          Wed: [],
          Thu: [],
          Fri: [],
          Sat: [],
          Sun: [],
        };

        recurringClassesData.forEach(
          (recurringClass: RecurringAvailability) => {
            const day = getWeekday(
              new Date(recurringClass.startAt),
              "Asia/Tokyo",
            ) as Day;
            const time = formatTime(
              new Date(recurringClass.startAt),
              "Asia/Tokyo",
            );

            newUnavailableSlots[day].push(time);
          },
        );

        const data = await fetchInstructorRecurringAvailabilities(instructorId);
        const newSlots: SlotsOfDays = {
          Mon: [],
          Tue: [],
          Wed: [],
          Thu: [],
          Fri: [],
          Sat: [],
          Sun: [],
        };

        // Add the current state to the new slots.
        if (day && time) {
          newSlots[day as keyof SlotsOfDays].push(time);
        }

        // Add the instructor recurring availability to the new slots.
        data.forEach((availability: RecurringAvailability) => {
          const day = getWeekday(
            new Date(availability.startAt),
            "Asia/Tokyo",
          ) as Day;
          const time = formatTime(new Date(availability.startAt), "Asia/Tokyo");

          if (!newUnavailableSlots[day].includes(time)) {
            newSlots[day].push(time);
          }
        });

        setSlots(newSlots);
        setTimes(newSlots[day as keyof SlotsOfDays]);
      } catch (error) {
        console.error(error);
      }
    };

    getRecurringAvailabilities();
  }, [instructorId, day, time]);

  const handleDayChange = (day: Day) => {
    const availableTimes = slots[day] || [];
    setState({
      ...state,
      day,
      time: availableTimes.length > 0 ? state.time : "",
    });
    setTimes(availableTimes);
  };

  const handleChildChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    changedChildId: number,
  ) => {
    const isChecked = e.target.checked;
    const newSelectedChildrenIds = new Set(childrenIds);

    if (isChecked) {
      newSelectedChildrenIds.add(changedChildId);
    } else {
      newSelectedChildrenIds.delete(changedChildId);
    }

    setState({ ...state, childrenIds: newSelectedChildrenIds });
  };

  if (!instructorsData || !childList) {
    return <Loading />;
  }

  return (
    <tr className={styles.body}>
      <td className={styles.bodyText}>{index + 1}</td>

      <td className={styles.bodyText}>
        <select
          name="instructors"
          value={instructorId || ""}
          onChange={(e) => {
            setState({ ...state, instructorId: parseInt(e.target.value) });
          }}
        >
          <option key="" value="" hidden></option>
          {instructorsData.map((instructor) => {
            return (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            );
          })}
        </select>
      </td>
      <td className={styles.bodyText}>
        <select
          name="days"
          value={day || ""}
          onChange={(e) => {
            handleDayChange(e.target.value as Day);
          }}
        >
          <option key="" value="" hidden></option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </td>
      <td className={styles.bodyText}>
        <select
          name="times"
          value={time || ""}
          onChange={(e) => {
            setState({ ...state, time: e.target.value });
          }}
        >
          <option key="" value="" hidden></option>
          {times ? (
            times.map((time, index) => (
              <option key={index} value={time}>
                {time}
              </option>
            ))
          ) : (
            <></>
          )}
        </select>
      </td>
      <td className={styles.bodyText}>
        {childList.map((child) => {
          const childrenIdsSet = new Set(childrenIds);
          return (
            <label key={child.id} htmlFor={`child-${state.id}-${child.id}`}>
              <input
                type="checkbox"
                id={`child-${state.id}-${child.id}`}
                checked={childrenIdsSet.has(child.id)}
                onChange={(event) => handleChildChange(event, child.id)}
              />
              {child.name}
            </label>
          );
        })}
      </td>
      <td className={styles.bodyText}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={tomorrowFormatted}
        />
      </td>
      <td className={styles.bodyText}>
        <ActionButton
          className="editBtn"
          onClick={(event) => onClickHandler(event, state, selectedDate)}
          btnText="Edit"
        />
      </td>
    </tr>
  );
}

export default RecurringClassEntry;
