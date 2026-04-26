"use client";

import InstructorSlotCalendar from "@/components/features/instructorSlotCalendar/InstructorSlotCalendar";
import MessageBoardPanel from "@/components/features/messageBoardPanel/MessageBoardPanel";
import { MessageTarget } from "@/types";
import styles from "./InstructorCalendarClient.module.scss";

type InstructorSlotScheduleClientProps = {
  instructorId: number;
  messageBoardPosts?: MessageBoardPostItem[];
};

export default function InstructorSlotScheduleClient({
  instructorId,
  messageBoardPosts = [],
}: InstructorSlotScheduleClientProps) {
  const visiblePosts = messageBoardPosts.filter(
    (post) =>
      post.target === MessageTarget.instructor ||
      post.target === MessageTarget.both,
  );

  return (
    <div className={styles.calendarContainer}>
      <MessageBoardPanel
        posts={visiblePosts}
        storageKey="instructorClassScheduleMessageBoardOpenState"
        readMessageStorageKey="readInstructorMessageNumber"
      />
      <InstructorSlotCalendar
        instructorId={instructorId}
        getClassDetailUrl={(classId) =>
          `/instructors/class-schedule/${classId}`
        }
        calendarOptions={{
          slotMinTime: "00:00:00",
          slotMaxTime: "24:00:00",
          slotDuration: "00:30:00",
          timeZone: "local",
        }}
      />
    </div>
  );
}
