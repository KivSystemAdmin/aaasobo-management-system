"use client";

import { useState } from "react";

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
  instructorsData: Instructors;
  childList: Child[];
  index: number;
  onClickHandler: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    state: RecurringClassState,
    startDate: string,
  ) => void;
}) {
  const { day, time, instructorId, childrenIds } = state;

  // TODO: Only instructors' availability should be selectable.
  // TODO: Before today shouldn't be selectable.
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const times = ["09:00", "11:00", "16:00", "16:30", "17:00"];
  const [selectedDate, setSelectedDate] = useState("");

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

  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        <select
          name="days"
          value={day || ""}
          onChange={(e) => {
            setState({ ...state, day: e.target.value });
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
      <td>
        <select
          name="times"
          value={time || ""}
          onChange={(e) => {
            setState({ ...state, time: e.target.value });
          }}
        >
          <option key="" value="" hidden></option>
          {times.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          name="instructors"
          value={instructorId || ""}
          onChange={(e) => {
            setState({ ...state, instructorId: parseInt(e.target.value) });
          }}
        >
          <option key="" value="" hidden></option>
          {instructorsData.data.map((instructor) => {
            return (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            );
          })}
        </select>
      </td>
      <td>
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
      <td>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </td>
      <td>
        <button
          type="button"
          onClick={(event) => onClickHandler(event, state, selectedDate)}
        >
          Edit
        </button>
      </td>
    </tr>
  );
}

export default RecurringClassEntry;
