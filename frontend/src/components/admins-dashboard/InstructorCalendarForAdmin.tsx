"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./InstructorCalendarForAdmin.module.scss";
import { getCalendarClasses } from "@/lib/api/instructorsApi";
import Loading from "../elements/loading/Loading";
import { getCurrentMonthValidRange } from "@/lib/utils/calendarUtils";
import { initialSetup } from "@/lib/utils/initialSetup";
import InstructorCalendarClient from "../instructors-dashboard/class-schedule/instructorCalendar/InstructorCalendarClient";
import InstructorSearch from "@/components/admins-dashboard/InstructorSearch";
import { getAllBusinessSchedules, getAllEvents } from "@/lib/api/adminsApi";
import type { SchedulesListResponse } from "@shared/schemas/admins";

function InstructorCalendarForAdmin({
  adminId,
  userSessionType,
}: {
  adminId: number | null;
  userSessionType: UserType;
}) {
  const [instructorId, setInstructorId] = useState<number | null>(null);
  const [instructorName, setInstructorName] = useState<string | null>(null);
  const [instructorCalendarEvents, setInstructorCalendarEvents] = useState<
    EventType[]
  >([]);
  const [calendarValidRange, setCalendarValidRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [schedule, setSchedule] = useState<SchedulesListResponse | null>(null);
  const [colorsForEvents, setColorsForEvents] = useState<
    { event: string; color: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (instructorId === null) return;

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const [classes, schedule, events] = await Promise.all([
        getCalendarClasses(instructorId),
        getAllBusinessSchedules(),
        getAllEvents(),
      ]);

      if (requestId !== requestIdRef.current) return;

      setInstructorCalendarEvents(classes);
      setCalendarValidRange(getCurrentMonthValidRange(3));
      setSchedule(schedule);
      const colorsForEvents: { event: string; color: string }[] = events
        .map((e: EventColor) => ({
          event: e.Event,
          color: e["Color Code"],
        }))
        .filter((e: { event: string; color: string }) => e.color !== "#FFFFFF"); // Filter out events with white color (#FFFFFF)
      setColorsForEvents(colorsForEvents);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setError("Failed to load classes. Please try again.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [instructorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Perform initial setup for the admin user
  useEffect(() => {
    initialSetup("admin");
  }, []);

  const handleSendInstructor = useCallback((id: number, name: string) => {
    requestIdRef.current += 1;
    localStorage.setItem("activeInstructor", String(id));
    setIsLoading(true);
    setError(null);
    setInstructorCalendarEvents([]);
    setInstructorId(id);
    setInstructorName(name);
  }, []);

  return (
    <div className={styles.calendarContainer}>
      <InstructorSearch
        handleSendInstructor={handleSendInstructor}
        activeInstructorId={instructorId}
      />
      {isLoading && <Loading />}
      {error && <div>{error}</div>}
      {!isLoading && !error && instructorId === null && (
        <p className={styles.emptyState}>
          Select an instructor to display their calendar.
        </p>
      )}
      {!isLoading &&
        !error &&
        instructorId !== null &&
        schedule !== null &&
        calendarValidRange !== null && (
          <>
            {userSessionType === "admin" && instructorName ? (
              <span className={styles.instructorName}>
                Instructor: &nbsp;{instructorName}
              </span>
            ) : null}
            <InstructorCalendarClient
              adminId={adminId}
              instructorId={instructorId}
              instructorCalendarEvents={instructorCalendarEvents}
              validRange={calendarValidRange}
              userSessionType={userSessionType}
              businessSchedule={schedule.organizedData}
              colorsForEvents={colorsForEvents}
            />
          </>
        )}
    </div>
  );
}

export default InstructorCalendarForAdmin;
