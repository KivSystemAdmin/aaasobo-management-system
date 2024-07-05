"use client";

import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import { useParams } from "next/navigation";
import { formatDateTime } from "@/app/helper/dateUtils";
import Calendar from "@/app/components/Calendar";
import {
  type Response,
  getInstructor,
  addAvailability,
  addRecurringAvailability,
  deleteAvailability,
  deleteRecurringAvailability,
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

  return (
    <>
      <h1>{instructor.name}</h1>
      <Calendar
        instructor={instructor}
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
