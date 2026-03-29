"use client";

import React, { useId, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import momentTimezonePlugin from "@fullcalendar/moment-timezone";
import { DayCellMountArg, EventClickArg } from "@fullcalendar/core";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./CustomerCalendar.module.scss";
import Modal from "@/components/elements/modal/Modal";
import ClassDetail from "@/components/features/classDetail/ClassDetail";
import {
  createRenderEventContent,
  getDayCellColorHandler,
  getValidRange,
} from "@/lib/utils/calendarUtils";
import CalendarLegend from "@/components/features/calendarLegend/CalendarLegend";

export default function CustomerCalendar({
  customerId,
  classes,
  createdAt,
  businessSchedule,
  colorsForEvents,
  messageBoardPosts,
  userSessionType,
}: CustomerCalendarProps) {
  const [isClassDetailModalOpen, setIsClassDetailModalOpen] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [classDetail, setClassDetail] = useState<CustomerClass | null>(null);
  const cacheBust = useId();
  const { language } = useLanguage();

  const handleEventClick = (clickInfo: EventClickArg) => {
    const classId = clickInfo.event.extendedProps.classId;
    const selectedClassDetail = classes.find(
      (classItem) => classItem.classId === classId,
    );
    selectedClassDetail && setClassDetail(selectedClassDetail);
    setIsClassDetailModalOpen(true);
  };

  const validRange = () => getValidRange(createdAt, 3);
  const renderCustomerEventContent = createRenderEventContent(
    "customer",
    cacheBust,
  );

  const handleModalClose = () => {
    setClassDetail(null);
    setIsClassDetailModalOpen(false);
  };

  const dayCellColors = getDayCellColorHandler(businessSchedule);
  const visiblePosts = messageBoardPosts.filter(
    (post) => post.target === "customers" || post.target === "both",
  );
  const latestPost = visiblePosts[0] ?? null;

  return (
    <>
      <div className={styles.calendarShell}>
        {latestPost ? (
          <section className={styles.messageBanner}>
            <div>
              <h3>Message Board</h3>
              <p>{latestPost.body}</p>
              <time>{new Date(latestPost.createdAt).toLocaleString()}</time>
            </div>
            {visiblePosts.length > 1 ? (
              <button
                type="button"
                onClick={() => setIsMessagesModalOpen(true)}
              >
                View past messages
              </button>
            ) : null}
          </section>
        ) : null}
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            momentTimezonePlugin,
          ]}
          initialView={"dayGridMonth"}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          events={classes}
          eventClick={handleEventClick}
          eventContent={renderCustomerEventContent}
          validRange={validRange}
          locale={language === "ja" ? "ja" : "en"}
          dayCellContent={(arg) => {
            return { html: String(arg.date.getDate()) };
          }}
          contentHeight="auto"
          dayMaxEvents={true}
          editable={false}
          selectable={false}
          eventDisplay="block"
          allDaySlot={false}
          dayCellDidMount={dayCellColors}
        />

        {colorsForEvents.length > 0 && (
          <CalendarLegend
            colorsForEvents={colorsForEvents}
            language={language}
          />
        )}
      </div>

      <Modal
        isOpen={isClassDetailModalOpen}
        onClose={handleModalClose}
        className="classDetail"
      >
        <ClassDetail
          classDetail={classDetail}
          customerId={customerId}
          handleModalClose={handleModalClose}
          language={language}
          userSessionType={userSessionType}
        />
      </Modal>
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
    </>
  );
}
