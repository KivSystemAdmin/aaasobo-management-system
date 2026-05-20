"use client";

import styles from "./BusinessCalendarClient.module.scss";
import FullCalendar from "@fullcalendar/react";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg } from "@fullcalendar/core";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "@/components/elements/modal/Modal";
import BusinessCalendarModal from "@/components/admins-dashboard/BusinessCalendarModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateScheduleAction } from "@/app/actions/updateContent";
import { CONTENT_UPDATE_SUCCESS_MESSAGE } from "@/lib/messages/formValidation";
import { getAllBusinessSchedules } from "@/lib/api/adminsApi";
import {
  BUSINESS_CALENDAR_TIME_ZONE,
  formatDateForScheduleUpdate,
  formatDateKeyInTimeZone,
  getDayCellColorHandler,
  getDayNumberInTimeZone,
} from "@/lib/utils/calendarUtils";
import CalendarLegend from "@/components/features/calendarLegend/CalendarLegend";
import { warningAlert } from "@/lib/utils/alertUtils";

const BusinessCalendarClient = ({
  businessSchedule: initialSchedule,
  events,
  validRange,
  userSessionType,
}: BusinessCalendarClientProps) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [businessSchedule, setBusinessSchedule] = useState(
    initialSchedule || [],
  );
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[] | []>([]);
  const [maxColumns, setMaxColumns] = useState(4);
  // Handle form messages manually for UpdateFormState
  const [localMessages, setLocalMessages] = useState<Record<string, string>>(
    {},
  );

  const clearErrorMessage = useCallback((field: string) => {
    setLocalMessages((prev) => {
      if (field === "all") {
        return {};
      }
      const updatedMessages = { ...prev };
      delete updatedMessages[field];
      delete updatedMessages.errorMessage;
      return updatedMessages;
    });
  }, []);
  const { language } = useLanguage();

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 640px)");
    const tabletQuery = window.matchMedia("(max-width: 1024px)");

    const updateColumns = () => {
      if (mobileQuery.matches) {
        setMaxColumns(1);
      } else if (tabletQuery.matches) {
        setMaxColumns(2);
      } else {
        setMaxColumns(4);
      }
    };

    updateColumns();
    mobileQuery.addEventListener("change", updateColumns);
    tabletQuery.addEventListener("change", updateColumns);

    return () => {
      mobileQuery.removeEventListener("change", updateColumns);
      tabletQuery.removeEventListener("change", updateColumns);
    };
  }, []);

  // Set color for each date in the calendar
  const dayCellColors = getDayCellColorHandler(
    businessSchedule,
    BUSINESS_CALENDAR_TIME_ZONE,
  );

  // Register or delete event on selected date
  const handleDateSelect = (arg: DateSelectArg) => {
    // Check if the user is authenticated as an admin
    if (userSessionType !== "admin") {
      return;
    }

    const startDate = new Date(arg.start);
    const endDate = new Date(arg.end.getTime() - 24 * 60 * 60 * 1000);
    const startDateStr = formatDateForScheduleUpdate(startDate);
    const endDateStr = formatDateForScheduleUpdate(endDate);

    // If the start date is the current date or before, do not allow selection
    if (startDate < new Date()) {
      warningAlert(
        language === "ja"
          ? "過去の日付は選択できません。"
          : "Cannot select past dates.",
      );
      return;
    }

    clearErrorMessage("eventId");
    setIsModalOpen(true);

    // Set selected dates for updating the schedule
    if (
      formatDateKeyInTimeZone(startDate) === formatDateKeyInTimeZone(endDate)
    ) {
      setSelectedDates([startDateStr]);
    } else {
      setSelectedDates([startDateStr, endDateStr]);
    }

    // Save the selected calendar position to localStorage
    const currentYear = Number(formatDateKeyInTimeZone(new Date()).slice(0, 4));
    const selectedYear = Number(formatDateKeyInTimeZone(startDate).slice(0, 4));

    if (selectedYear < currentYear) {
      localStorage.setItem("calendarPosition", "prev");
    } else if (selectedYear > currentYear) {
      localStorage.setItem("calendarPosition", "next");
    } else {
      localStorage.setItem("calendarPosition", "default");
    }
  };

  const initialDate = useMemo(() => {
    if (typeof window === "undefined") {
      return new Date().toISOString();
    }

    const saved = localStorage.getItem("calendarPosition");

    switch (saved) {
      case "prev":
        return new Date(new Date().getFullYear() - 1, 1, 0).toISOString();
      case "next":
        return new Date(new Date().getFullYear() + 1, 1, 0).toISOString();
      default:
        return new Date().toISOString();
    }
  }, []);

  // Fetch the schedule data when the schedule is updated
  const fetchSchedule = async () => {
    try {
      const data = await getAllBusinessSchedules();
      setBusinessSchedule(data.organizedData);
    } catch (err) {
      toast.error("Failed to fetch schedule data");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await updateScheduleAction(undefined, formData);
    const newMessages: Record<string, string> = {};

    if ("eventId" in result && result.eventId) {
      newMessages.eventId = result.eventId;
    }
    if ("errorMessage" in result && result.errorMessage) {
      newMessages.errorMessage = result.errorMessage;
    }

    setLocalMessages(newMessages);

    if ("result" in result && result.result) {
      toast.success(CONTENT_UPDATE_SUCCESS_MESSAGE("schedule"));
      await fetchSchedule();
      setIsModalOpen(false);
      setSelectedDates([]);
      setScheduleVersion((prev) => prev + 1);
    } else if ("errorMessage" in result && result.errorMessage) {
      toast.error(result.errorMessage);
    }
  };

  // Display the failure message if the schedule is not loaded
  if (!businessSchedule || businessSchedule.length === 0 || !events) {
    return <div>Failed to load AaasoBo! schedule.</div>;
  }

  // Map events to the format required for the calendar legend
  const colorsForEvents: { event: string; color: string }[] = events.map(
    (e: BusinessEventType) => ({
      event: e.name,
      color: e.color!,
    }),
  );

  return (
    <>
      <div className={styles.calendarContainer}>
        <FullCalendar
          key={scheduleVersion}
          ref={calendarRef}
          plugins={[interactionPlugin, multiMonthPlugin]}
          initialView="multiMonthYear"
          initialDate={initialDate}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          timeZone="Asia/Tokyo"
          locale={language === "ja" ? "ja" : "en"}
          dayCellContent={(arg) => {
            return { html: getDayNumberInTimeZone(arg.date) };
          }}
          contentHeight="auto"
          selectable={userSessionType === "admin"}
          multiMonthMinWidth={100}
          showNonCurrentDates={false}
          validRange={validRange}
          dayCellDidMount={dayCellColors}
          select={handleDateSelect}
          multiMonthMaxColumns={maxColumns}
        />
        {events.length > 0 && (
          <CalendarLegend
            colorsForEvents={colorsForEvents}
            language={language}
          />
        )}
        {userSessionType === "admin" && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            className="businessCalendarModal"
          >
            <form onSubmit={handleSubmit}>
              <BusinessCalendarModal
                selectedDates={selectedDates}
                events={events}
                localMessages={localMessages}
                clearErrorMessage={clearErrorMessage}
              />
            </form>
          </Modal>
        )}
      </div>
    </>
  );
};

export default BusinessCalendarClient;
