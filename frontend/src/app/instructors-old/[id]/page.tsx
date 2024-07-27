"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { useParams } from "next/navigation";
import { formatDateTime } from "@/app/helper/dateUtils";
import { useInput } from "@/app/hooks/useInput";
import Calendar from "@/app/components/Calendar";
import {
  type Response,
  getInstructor,
  addAvailability,
  addRecurringAvailability,
  deleteAvailability,
  deleteRecurringAvailability,
  extendRecurringAvailability,
} from "@/app/helper/instructorsApi";

type Availability = {
  dateTime: string;
  instructorRecurringAvailabilityId?: number;
};

type Instructor = {
  id: number;
  name: string;
  availabilities: Availability[];
};

export default function Page() {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [selectedDateTime, setSelectedInfo] = useState<{
    dateTime: Date;
  } | null>(null);
  const [clickedEvent, setClickedEvent] = useState<{ dateTime: Date } | null>(
    null,
  );
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const addRecurringButtonRef = useRef<HTMLButtonElement>(null);
  const id = parseInt(useParams<{ id: string }>().id);

  const fetchInstructors = useCallback(async () => {
    const res: Response<{ instructor: Instructor }> = await getInstructor(id);
    if (showErrorMessage(res)) {
      return;
    }
    setInstructor(res.instructor);
  }, [id]);

  useEffect(() => {
    fetchInstructors();
  }, [id, fetchInstructors]);

  if (isNaN(id)) {
    return <h2>Invalid ID</h2>;
  }

  if (!instructor) {
    return <h2>Loading...</h2>;
  }

  const events = instructor.availabilities.map((availability, index) => {
    const start = availability.dateTime;
    const end = new Date(new Date(start).getTime() + 25 * 60000).toISOString();
    return {
      id: index.toString(),
      start,
      end,
    };
  });

  return (
    <>
      <h1>{instructor.name}</h1>
      <Calendar
        events={events}
        selectable={true}
        select={(info) => {
          setClickedEvent(null);
          setSelectedInfo({ dateTime: info.start });
        }}
        unselect={(info) => {
          const node = info.jsEvent.target as Node;
          const buttonIsClicked =
            addButtonRef?.current?.contains(node) ||
            addRecurringButtonRef?.current?.contains(node);
          if (buttonIsClicked) {
            // Prevent unselect when clicking an add button
            return;
          }
          setClickedEvent(null);
          setSelectedInfo(null);
        }}
        eventClick={(info) => {
          if (info.event.start) {
            setClickedEvent({ dateTime: info.event.start });
          }
        }}
      />
      <ExtendRecurringAvailabilityButton
        instructorId={instructor.id}
        refresh={fetchInstructors}
      />
      {selectedDateTime && (
        <>
          <p>{formatDateTime(selectedDateTime.dateTime, "Asia/Tokyo")}</p>
          <AddAvailabilityButton
            ref={addButtonRef}
            props={{
              instructorId: instructor.id,
              dateTime: selectedDateTime.dateTime,
              refresh: async () => {
                setSelectedInfo(null);
                await fetchInstructors();
              },
            }}
          />
          <AddRecurringAvailabilityButton
            ref={addRecurringButtonRef}
            props={{
              instructorId: instructor.id,
              dateTime: selectedDateTime.dateTime,
              refresh: async () => {
                setSelectedInfo(null);
                await fetchInstructors();
              },
            }}
          />
        </>
      )}
      {clickedEvent && (
        <>
          <p>{formatDateTime(clickedEvent.dateTime, "Asia/Tokyo")}</p>
          <DeleteAvailabilityButton
            instructorId={instructor.id}
            dateTime={clickedEvent.dateTime}
            refresh={async () => {
              setClickedEvent(null);
              await fetchInstructors();
            }}
          />
          <DeleteRecurringAvailabilityButton
            instructorId={instructor.id}
            dateTime={clickedEvent.dateTime}
            refresh={async () => {
              setClickedEvent(null);
              await fetchInstructors();
            }}
          />
        </>
      )}
    </>
  );
}

function showErrorMessage<T extends object>(
  response: Response<T>,
): response is { message: string } {
  if ("message" in response) {
    alert(response.message);
    return true;
  }
  return false;
}

// ref is used to prevent unselect when clicking the button.
const AddAvailabilityButton = forwardRef<
  HTMLButtonElement,
  {
    props: {
      instructorId: number;
      dateTime: Date;
      refresh: () => Promise<void>;
    };
  }
>(({ props }, ref) => {
  const { instructorId, dateTime, refresh } = props;

  const submit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!dateTime) {
      return;
    }
    const res = await addAvailability(instructorId, dateTime.toISOString());
    if (showErrorMessage(res)) {
      return;
    }
    await refresh();
  };

  return (
    <button ref={ref} onClick={submit}>
      Add
    </button>
  );
});

// ref is used to prevent unselect when clicking the button.
const AddRecurringAvailabilityButton = forwardRef<
  HTMLButtonElement,
  {
    props: {
      instructorId: number;
      dateTime: Date;
      refresh: () => Promise<void>;
    };
  }
>(({ props }, ref) => {
  const { instructorId, dateTime, refresh } = props;

  const submit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!dateTime) {
      return;
    }
    const res = await addRecurringAvailability(
      instructorId,
      dateTime.toISOString(),
    );
    if (showErrorMessage(res)) {
      return;
    }
    await refresh();
  };

  return (
    <button ref={ref} onClick={submit}>
      Add Recurring
    </button>
  );
});

function DeleteAvailabilityButton({
  instructorId,
  dateTime,
  refresh,
}: {
  instructorId: number;
  dateTime: Date;
  refresh: () => Promise<void>;
}) {
  const submit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const res = await deleteAvailability(instructorId, dateTime.toISOString());
    if (showErrorMessage(res)) {
      return;
    }
    await refresh();
  };

  return <button onClick={submit}>Delete</button>;
}

function DeleteRecurringAvailabilityButton({
  instructorId,
  dateTime,
  refresh,
}: {
  instructorId: number;
  dateTime: Date;
  refresh: () => Promise<void>;
}) {
  const submit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const res = await deleteRecurringAvailability(
      instructorId,
      dateTime.toISOString(),
    );
    if (showErrorMessage(res)) {
      return;
    }
    await refresh();
  };

  return <button onClick={submit}>Delete Recurring</button>;
}

function ExtendRecurringAvailabilityButton({
  instructorId,
  refresh,
}: {
  instructorId: number;
  refresh: () => Promise<void>;
}) {
  const [until, onUntilChange] = useInput();
  const submit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!until) {
      return;
    }
    const res = await extendRecurringAvailability(
      instructorId,
      `${until}T23:59:59+09:00`,
    );
    if (showErrorMessage(res)) {
      return;
    }
    await refresh();
  };

  return (
    <>
      <label>
        until
        <input type="date" value={until} onChange={onUntilChange} />
      </label>
      <button onClick={submit}>Extend Recurring Availability</button>
    </>
  );
}
