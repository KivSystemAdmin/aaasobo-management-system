"use client";

import { useEffect, useState } from "react";
import {
  getActiveInstructorSchedule,
  InstructorSlot,
} from "@/lib/api/instructorsApi";
import { getTodayInJapanISODate } from "@/lib/utils/dateUtils";
import ScheduleCalendar from "@/components/admins-dashboard/instructors-dashboard/instructor-schedule/ScheduleCalendar";
import Loading from "@/components/elements/loading/Loading";
import styles from "./page.module.scss";

export default function AvailabilityPageClient({
  instructorId,
}: {
  instructorId: number;
}) {
  const [slots, setSlots] = useState<InstructorSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const today = getTodayInJapanISODate();
        const scheduleData = await getActiveInstructorSchedule(
          instructorId,
          today,
        );
        if (scheduleData.schedule?.slots) {
          setSlots(scheduleData.schedule.slots);
        }
      } catch (err) {
        console.error("Failed to fetch instructor schedule:", err);
        setError("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [instructorId]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div>
        <h1>Instructor Schedule</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.title}>Instructor Schedule Calendar</h1>
      <p>This is your current schedule in Japan Standard Time (JST).</p>
      <ScheduleCalendar slots={slots} />
    </div>
  );
}
