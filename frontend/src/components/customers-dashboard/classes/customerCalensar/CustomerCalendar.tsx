"use client";

import React, { useState } from "react";
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
  getCurrentMonthValidRange,
  getDayCellColorHandler,
} from "@/lib/utils/calendarUtils";
import CalendarLegend from "@/components/features/calendarLegend/CalendarLegend";

const japanDayFormatter = new Intl.DateTimeFormat("en", {
  timeZone: "Asia/Tokyo",
  day: "numeric",
});

export default function CustomerCalendar({
  customerId,
  classes,
  businessSchedule,
  colorsForEvents,
  userSessionType,
}: CustomerCalendarProps) {
  const [isClassDetailModalOpen, setIsClassDetailModalOpen] = useState(false);
  const [classDetail, setClassDetail] = useState<CustomerClass | null>(null);
  const { language } = useLanguage();

  const handleEventClick = (clickInfo: EventClickArg) => {
    const classId = clickInfo.event.extendedProps.classId;
    const selectedClassDetail = classes.find(
      (classItem) => classItem.classId === classId,
    );
    selectedClassDetail && setClassDetail(selectedClassDetail);
    setIsClassDetailModalOpen(true);
  };

  const validRange = () => getCurrentMonthValidRange(3);
  const renderCustomerEventContent = createRenderEventContent(
    "customer",
    "Asia/Tokyo",
  );

  const handleModalClose = () => {
    setClassDetail(null);
    setIsClassDetailModalOpen(false);
  };

  const dayCellColors = getDayCellColorHandler(businessSchedule);

  return (
    <>
      <div className={styles.calendarShell}>
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
            return { html: japanDayFormatter.format(arg.date) };
          }}
          contentHeight="auto"
          dayMaxEvents={true}
          editable={false}
          selectable={false}
          eventDisplay="block"
          allDaySlot={false}
          timeZone="Asia/Tokyo"
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
    </>
  );
}
