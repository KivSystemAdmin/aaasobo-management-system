"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./AvailabilityWeekGrid.module.scss";
import { useCustomerTimeZone } from "@/contexts/CustomerTimeZoneContext";

const DATE_KEY_TIME_ZONE = "UTC";
const LOAD_TIMEOUT_MS = 30000;
const WEEKDAY_LABELS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ja: ["日", "月", "火", "水", "木", "金", "土"],
};

export type AvailabilityWeekGridSlot = {
  dateTime: string;
  instructorCount?: number;
};

type AvailabilityWeekGridProps = {
  fetchSlots: (
    startDate: string,
    endDate: string,
  ) => Promise<AvailabilityWeekGridSlot[]>;
  onSlotSelect: (slot: AvailabilityWeekGridSlot) => void;
  language: LanguageType;
  showInstructorCount?: boolean;
};

const getDateParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value || "1970",
    month: parts.find((part) => part.type === "month")?.value || "01",
    day: parts.find((part) => part.type === "day")?.value || "01",
  };
};

const getDateKey = (date: Date, timeZone: string) => {
  const { year, month, day } = getDateParts(date, timeZone);
  return `${year}-${month}-${day}`;
};

const dateKeyToDate = (dateKey: string) => new Date(`${dateKey}T00:00:00Z`);

const addDays = (dateKey: string, days: number) => {
  const date = dateKeyToDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return getDateKey(date, DATE_KEY_TIME_ZONE);
};

const getWeekStart = (dateKey: string) => {
  const date = dateKeyToDate(dateKey);
  return addDays(dateKey, -date.getUTCDay());
};

const getWeekDates = (weekStart: string) =>
  Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

const formatWeekRange = (weekDates: string[], language: LanguageType) => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: DATE_KEY_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${formatter.format(dateKeyToDate(weekDates[0]))} - ${formatter.format(dateKeyToDate(weekDates[6]))}`;
};

const formatHeaderDate = (dateKey: string, language: LanguageType) => {
  const locale = language === "ja" ? "ja-JP" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    timeZone: DATE_KEY_TIME_ZONE,
    month: "numeric",
    day: "numeric",
  }).format(dateKeyToDate(dateKey));
};

const formatHeaderLabel = (
  dateKey: string,
  weekdayIndex: number,
  language: LanguageType,
) => {
  return `${WEEKDAY_LABELS[language][weekdayIndex]} ${formatHeaderDate(
    dateKey,
    language,
  )}`;
};

const formatSlotTime = (dateTime: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateTime));

const getInstructorCountLabel = (
  count: number | undefined,
  language: LanguageType,
) => {
  if (!count) {
    return language === "ja" ? "講師0名" : "0 instructors";
  }

  return language === "ja"
    ? `講師${count}名`
    : `${count} ${count === 1 ? "instructor" : "instructors"}`;
};

export default function AvailabilityWeekGrid({
  fetchSlots,
  onSlotSelect,
  language,
  showInstructorCount = false,
}: AvailabilityWeekGridProps) {
  const timeZone = useCustomerTimeZone();
  const resolvedTimeZone = timeZone || DATE_KEY_TIME_ZONE;
  const todayDateKey = getDateKey(new Date(), resolvedTimeZone);
  const [weekStart, setWeekStart] = useState(() =>
    getWeekStart(getDateKey(new Date(), resolvedTimeZone)),
  );
  const [slots, setSlots] = useState<AvailabilityWeekGridSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  useEffect(() => {
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const loadSlots = async () => {
      const requestStart = Date.now();
      const startDate = addDays(weekDates[0], -1);
      const endDateExclusive = addDays(weekDates[6], 2);

      console.log("[availability-week-grid][load:start]", {
        startDate,
        endDateExclusive,
        language,
      });

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextSlots = await Promise.race([
          fetchSlots(startDate, endDateExclusive),
          new Promise<AvailabilityWeekGridSlot[]>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error("Availability request timed out"));
            }, LOAD_TIMEOUT_MS);
          }),
        ]);

        if (isActive) {
          setSlots(nextSlots);
        }

        console.log("[availability-week-grid][load:success]", {
          startDate,
          endDateExclusive,
          slotCount: nextSlots.length,
          durationMs: Date.now() - requestStart,
        });
      } catch (error) {
        console.error("Failed to fetch availability week:", error);
        console.log("[availability-week-grid][load:error]", {
          startDate,
          endDateExclusive,
          durationMs: Date.now() - requestStart,
          error: error instanceof Error ? error.message : String(error),
        });
        if (isActive) {
          setSlots([]);
          setErrorMessage(
            language === "ja"
              ? "スケジュールの読み込みに失敗しました"
              : "Failed to load schedule",
          );
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadSlots();

    return () => {
      isActive = false;
    };
  }, [fetchSlots, language, weekDates]);

  const slotsByDate = useMemo(() => {
    const grouped = slots.reduce<Record<string, AvailabilityWeekGridSlot[]>>(
      (groupedSlots, slot) => {
        const dateKey = getDateKey(new Date(slot.dateTime), resolvedTimeZone);
        if (!groupedSlots[dateKey]) {
          groupedSlots[dateKey] = [];
        }
        groupedSlots[dateKey].push(slot);
        return groupedSlots;
      },
      {},
    );

    Object.values(grouped).forEach((daySlots) => {
      daySlots.sort(
        (first, second) =>
          new Date(first.dateTime).getTime() -
          new Date(second.dateTime).getTime(),
      );
    });

    return grouped;
  }, [resolvedTimeZone, slots]);

  const goToPreviousWeek = useCallback(() => {
    setWeekStart((currentWeekStart) => addDays(currentWeekStart, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStart((currentWeekStart) => addDays(currentWeekStart, 7));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setWeekStart(getWeekStart(getDateKey(new Date(), resolvedTimeZone)));
  }, [resolvedTimeZone]);

  useEffect(() => {
    if (timeZone) {
      // Reset the date-key state when the post-hydration browser zone arrives.
      setWeekStart(getWeekStart(getDateKey(new Date(), timeZone)));
    }
  }, [timeZone]);

  if (!timeZone) return null;

  return (
    <div className={styles.gridShell}>
      <div className={styles.toolbar}>
        <div className={styles.navigationControls}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={language === "ja" ? "前の週" : "Previous week"}
            onClick={goToPreviousWeek}
          >
            &lsaquo;
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={language === "ja" ? "次の週" : "Next week"}
            onClick={goToNextWeek}
          >
            &rsaquo;
          </button>
          <button
            type="button"
            className={styles.todayButton}
            onClick={goToCurrentWeek}
          >
            {language === "ja" ? "今日" : "today"}
          </button>
        </div>
        <div className={styles.weekRange}>
          {formatWeekRange(weekDates, language)}
        </div>
      </div>

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      <div className={styles.gridScroller}>
        <div className={styles.calendarGrid}>
          <div className={styles.headerRow}>
            {weekDates.map((dateKey, index) => (
              <div
                key={dateKey}
                className={`${styles.dayHeader} ${
                  dateKey === todayDateKey ? styles.todayDayHeader : ""
                }`}
              >
                {formatHeaderLabel(dateKey, index, language)}
              </div>
            ))}
          </div>

          <div className={styles.slotRows}>
            {weekDates.map((dateKey) => {
              const daySlots = slotsByDate[dateKey] || [];

              return (
                <div key={dateKey} className={styles.dayColumn}>
                  {isLoading ? (
                    <div className={styles.loadingSlot}>
                      {language === "ja" ? "読み込み中" : "Loading"}
                    </div>
                  ) : daySlots.length > 0 ? (
                    daySlots.map((slot) => (
                      <button
                        key={slot.dateTime}
                        type="button"
                        className={styles.timeSlot}
                        onClick={() => onSlotSelect(slot)}
                      >
                        <span className={styles.slotTime}>
                          {formatSlotTime(slot.dateTime, timeZone)}
                        </span>
                        {showInstructorCount && (
                          <span className={styles.instructorCount}>
                            {getInstructorCountLabel(
                              slot.instructorCount,
                              language,
                            )}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className={styles.noSlots}>
                      {language === "ja" ? "空きなし" : "No slots"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
