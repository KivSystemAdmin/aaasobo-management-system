"use client";

import { useEffect, useState } from "react";
import {
  getActiveInstructorSchedule,
  InstructorSlot,
} from "@/lib/api/instructorsApi";
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
        const today = new Date().toISOString().split("T")[0];
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
      <p>This shows the current active schedule for this instructor.</p>
      <ScheduleCalendar slots={slots} />
    </div>
  );
}
