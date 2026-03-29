"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import type { CalendarApi, EventClickArg } from "@fullcalendar/core";
import {
  createRenderEventContent,
  getClassSlotTimesForCalendar,
  getDayCellColorHandler,
} from "@/lib/utils/calendarUtils";
import CalendarLegend from "@/components/features/calendarLegend/CalendarLegend";
import Modal from "@/components/elements/modal/Modal";
import styles from "./InstructorCalendarClient.module.scss";

const InstructorCalendarClient = ({
  adminId,
  instructorId,
  userSessionType,
  instructorCalendarEvents,
  validRange,
  businessSchedule,
  colorsForEvents,
  messageBoardPosts = [],
}: InstructorCalendarClientProps) => {
  const router = useRouter();
  const cacheBust = useId();
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentView, setCurrentView] = useState("timeGridWeek");
  const [isTodayInRange, setIsTodayInRange] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const visiblePosts = messageBoardPosts.filter(
    (post) => post.target === "instructors" || post.target === "both",
  );
  const latestPost = visiblePosts[0] ?? null;

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (clickInfo.event.title === "No booked class") return;

    const classId = clickInfo.event.extendedProps.classId;
    const redirectURL =
      userSessionType === "admin"
        ? `/admins/${adminId}/calendar/${instructorId}/class-schedule/${classId}`
        : `/instructors/${instructorId}/class-schedule/${classId}`;

    router.push(redirectURL);
  };

  const renderInstructorEventContent = createRenderEventContent(
    "instructor",
    cacheBust,
  );

  const classSlotTimes = getClassSlotTimesForCalendar();

  const dayCellColors = getDayCellColorHandler(businessSchedule);

  const handleCalendarNav = (action: "prev" | "next" | "today") => {
    if (!calendarApi) return;
    if (action === "prev") calendarApi.prev();
    if (action === "next") calendarApi.next();
    if (action === "today") calendarApi.today();
  };

  const handleViewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextView = event.target.value;
    setCurrentView(nextView);
    calendarApi?.changeView(nextView);
  };

  return (
    <div className={styles.calendarContainer}>
      {latestPost ? (
        <section className={styles.messageBanner}>
          <div>
            <h3>Message Board</h3>
            <p>{latestPost.body}</p>
            <time>{new Date(latestPost.createdAt).toLocaleString()}</time>
          </div>
          {visiblePosts.length > 1 ? (
            <button type="button" onClick={() => setIsMessagesModalOpen(true)}>
              View past messages
            </button>
          ) : null}
        </section>
      ) : null}
      <div className={styles.mobileToolbar}>
        <div className={styles.navGroup}>
          <button
            type="button"
            className={`${styles.navButton} fc-button fc-button-primary fc-prev-button`}
            onClick={() => handleCalendarNav("prev")}
            aria-label="Previous"
          >
            {"<"}
          </button>
          <button
            type="button"
            className={`${styles.navButton} fc-button fc-button-primary fc-next-button`}
            onClick={() => handleCalendarNav("next")}
            aria-label="Next"
          >
            {">"}
          </button>
          <button
            type="button"
            className={`${styles.todayButton} fc-button fc-button-primary fc-today-button${
              isTodayInRange ? " fc-button-disabled" : ""
            }`}
            onClick={() => handleCalendarNav("today")}
            disabled={isTodayInRange}
          >
            today
          </button>
        </div>
        <div className={styles.mobileTitle}>{currentTitle}</div>
        <div className={styles.actionGroup}>
          <select
            className={styles.viewSelect}
            value={currentView}
            onChange={handleViewChange}
            aria-label="Select calendar view"
          >
            <option value="dayGridMonth">Month</option>
            <option value="timeGridWeek">Week</option>
            <option value="timeGridDay">Day</option>
          </select>
        </div>
      </div>
      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          momentTimezonePlugin,
        ]}
        initialView={"timeGridWeek"}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={instructorCalendarEvents}
        eventClick={handleEventClick}
        eventContent={renderInstructorEventContent}
        validRange={validRange}
        locale="en"
        contentHeight="auto"
        dayMaxEvents={true}
        editable={false}
        selectable={false}
        eventDisplay="block"
        allDaySlot={false}
        {...(classSlotTimes && {
          slotMinTime: classSlotTimes.start,
          slotMaxTime: classSlotTimes.end,
        })}
        slotLabelFormat={{
          hour: "numeric",
          minute: "2-digit",
          hour12: false,
        }}
        dayCellDidMount={dayCellColors}
        datesSet={(arg) => {
          setCalendarApi(arg.view.calendar);
          setCurrentTitle(arg.view.title);
          setCurrentView(arg.view.type);
          const now = new Date();
          const isInRange =
            arg.view.currentStart <= now && now < arg.view.currentEnd;
          setIsTodayInRange(isInRange);
        }}
      />

      {colorsForEvents.length > 0 && (
        <CalendarLegend colorsForEvents={colorsForEvents} language="en" />
      )}
      <Modal
        isOpen={isMessagesModalOpen}
        onClose={() => setIsMessagesModalOpen(false)}
        overlayClosable
      >
        <div className={styles.messageModalContent}>
          <h3>Message Board History</h3>
          <ul>
            {visiblePosts.map((post) => (
              <li key={post.id}>
                <p>{post.body}</p>
                <time>{new Date(post.createdAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default InstructorCalendarClient;
