"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  UserIcon,
  UsersIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import styles from "./DashboardClient.module.scss";
import { defaultUserImageUrl } from "@/lib/data/data";
import Modal from "@/components/elements/modal/Modal";
import InputField from "@/components/elements/inputField/InputField";
import RadioButton from "@/components/elements/radioButton/RadioButton";
import TextAreaInput from "@/components/elements/textAreaInput/TextAreaInput";
import {
  createMessageBoardPost,
  getMessageBoardPosts,
} from "@/lib/api/adminsApi";

type DashboardMetric = {
  totalCustomers: number;
  totalChildren: number;
  instructorsByEnglishBackground: {
    nonNative: number;
    nativeA: number;
    nativeB: number;
  };
};

type MonthlyData = {
  month: string;
  value: number;
};

type InstructorAttendanceMonthly = {
  year: number;
  month: string;
  trialLessons: number;
  regularLessons: number;
  cancelLessons: number;
  cancelWithoutNoticeLessons: number;
  attendanceRate: number;
};

type InstructorAttendanceItem = {
  id: number;
  nickname: string;
  imageUrl: string;
  englishBackgroundClass: "non-native" | "native-a" | "native-b";
  monthly: InstructorAttendanceMonthly[];
};

type MessageTarget = "customers" | "instructors" | "both";

type MessageItem = {
  id: number;
  target: MessageTarget;
  body: string;
  createdAt: string;
};

type EnglishBackgroundFilter = "all" | "non-native" | "native-a" | "native-b";

function InstructorAvatar({
  imageUrl,
  nickname,
  englishBackgroundClass,
}: {
  imageUrl: string;
  nickname: string;
  englishBackgroundClass: "non-native" | "native-a" | "native-b";
}) {
  const [imageError, setImageError] = useState(false);
  const safeSrc =
    imageError || !imageUrl.trim() ? defaultUserImageUrl : imageUrl;

  return (
    <Image
      src={safeSrc}
      alt={nickname}
      width={48}
      height={48}
      unoptimized
      className={`${styles.instructorAvatar} ${styles[englishBackgroundClass]}`}
      onError={() => setImageError(true)}
    />
  );
}

function SimpleBarChart({
  title,
  data,
  color,
}: {
  title: string;
  data: MonthlyData[];
  color: "blue" | "pink";
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={styles.chartCard}>
      <h3>{title}</h3>
      <div className={styles.barChart}>
        {data.map((item) => {
          const normalizedHeight =
            item.value === 0 ? 0 : Math.max((item.value / maxValue) * 100, 4);
          const height = `${normalizedHeight}%`;
          return (
            <div key={item.month} className={styles.barItem}>
              <span className={styles.barValue}>{item.value}</span>
              <div
                className={`${styles.bar} ${
                  color === "blue" ? styles.barBlue : styles.barPink
                }`}
                style={{ height }}
                title={`${item.month}: ${item.value}`}
                aria-label={`${item.month}: ${item.value}`}
              />
              <span>{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardClient({
  metrics,
  monthRangeLabel,
  newCustomersByMonth,
  churnCustomersByMonth,
  instructorAttendance,
}: {
  metrics: DashboardMetric;
  monthRangeLabel: string;
  newCustomersByMonth: MonthlyData[];
  churnCustomersByMonth: MonthlyData[];
  attendanceByMonth: MonthlyData[];
  instructorAttendance: InstructorAttendanceItem[];
}) {
  const [target, setTarget] = useState<MessageTarget>("customers");
  const [message, setMessage] = useState("");
  const [recentMessages, setRecentMessages] = useState<MessageItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isRecentMessagesModalOpen, setIsRecentMessagesModalOpen] =
    useState(false);
  const [selectedInstructor, setSelectedInstructor] =
    useState<InstructorAttendanceItem | null>(null);
  const [instructorSearch, setInstructorSearch] = useState("");
  const [englishBackgroundFilter, setEnglishBackgroundFilter] =
    useState<EnglishBackgroundFilter>("all");

  const normalizedSearch = instructorSearch.trim().toLowerCase();
  const latestMessage = useMemo(
    () => recentMessages[0] ?? null,
    [recentMessages],
  );

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await getMessageBoardPosts();
        setRecentMessages(data.slice(0, 20));
      } catch (error) {
        console.error("Failed to load message board posts:", error);
      }
    };

    loadMessages();
  }, []);

  const filteredInstructors = instructorAttendance.filter((instructor) => {
    const matchesSearch = instructor.nickname
      .toLowerCase()
      .includes(normalizedSearch);
    const matchesEnglishBackground =
      englishBackgroundFilter === "all" ||
      instructor.englishBackgroundClass === englishBackgroundFilter;

    return matchesSearch && matchesEnglishBackground;
  });

  const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim()) {
      setFeedback("Please enter a message before sending.");
      return;
    }

    try {
      const response = await createMessageBoardPost({
        target,
        body: message.trim(),
      });
      setRecentMessages((prev) => [response.data, ...prev].slice(0, 20));
      setMessage("");
      setFeedback("Message sent successfully.");
    } catch (error) {
      console.error("Failed to post a message:", error);
      setFeedback("Failed to send message. Please try again.");
    }
  };

  return (
    <section className={styles.dashboardContainer}>
      <div className={styles.messageBoardCard}>
        <div className={styles.messageHeader}>
          <h2>Message Board</h2>
        </div>

        <div className={styles.messageBoardContent}>
          <form onSubmit={submitMessage} className={styles.messageForm}>
            <div className={styles.segmentedControl}>
              {(["customers", "instructors", "both"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={target === option ? styles.activeTarget : ""}
                  onClick={() => setTarget(option)}
                >
                  {"For "} {option[0].toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
            <TextAreaInput
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Write a message for your selected audience..."
              unstyled
              withLabelWrapper={false}
              containerClassName={styles.messageTextAreaField}
              inputWrapperClassName={styles.messageTextAreaWrapper}
              inputClassName={styles.messageTextAreaInput}
            />
            <div className={styles.messageActions}>
              {feedback ? <p>{feedback}</p> : null}
              <button type="submit">Send</button>
            </div>
          </form>

          <aside className={styles.messageHistory}>
            <h3>Recent Messages</h3>
            {recentMessages.length === 0 ? (
              <p className={styles.emptyText}>
                No messages sent in this session yet.
              </p>
            ) : (
              <div className={styles.messagePreview}>
                {latestMessage ? (
                  <article>
                    <strong>{latestMessage.target}</strong>
                    <p>{latestMessage.body}</p>
                    <time>
                      {new Date(latestMessage.createdAt).toLocaleString()}
                    </time>
                  </article>
                ) : null}
                <button
                  type="button"
                  className={styles.historyButton}
                  onClick={() => setIsRecentMessagesModalOpen(true)}
                >
                  View all messages
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
      <Modal
        isOpen={isRecentMessagesModalOpen}
        onClose={() => setIsRecentMessagesModalOpen(false)}
        overlayClosable
      >
        <div className={styles.recentMessagesModal}>
          <h3>Recent Messages</h3>
          {recentMessages.length === 0 ? (
            <p className={styles.emptyText}>No messages posted yet.</p>
          ) : (
            <ul>
              {recentMessages.map((item) => (
                <li key={item.id}>
                  <strong>{item.target}</strong>
                  <p>{item.body}</p>
                  <time>{new Date(item.createdAt).toLocaleString()}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <UsersIcon className={styles.kpiIcon} />
          <div>
            <p>Total Customers</p>
            <strong>{metrics.totalCustomers}</strong>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <UserGroupIcon className={styles.kpiIcon} />
          <div>
            <p>Total Children</p>
            <strong>{metrics.totalChildren}</strong>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <UserGroupIcon className={styles.kpiIcon} />
          <div className={styles.instructorKpiContent}>
            <p>Total Instructors</p>
            <strong>
              {metrics.instructorsByEnglishBackground.nonNative +
                metrics.instructorsByEnglishBackground.nativeA +
                metrics.instructorsByEnglishBackground.nativeB}
            </strong>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <UserGroupIcon className={styles.kpiIcon} />
          <div className={styles.instructorKpiContent}>
            <p>Non Native</p>
            <strong>{metrics.instructorsByEnglishBackground.nonNative}</strong>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <UsersIcon className={styles.kpiIcon} />
          <div className={styles.instructorKpiContent}>
            <p>Native A</p>
            <strong>{metrics.instructorsByEnglishBackground.nativeA}</strong>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <UserIcon className={styles.kpiIcon} />
          <div className={styles.instructorKpiContent}>
            <p>Native B</p>
            <article>
              <strong>{metrics.instructorsByEnglishBackground.nativeB}</strong>
            </article>
          </div>
        </article>
      </div>

      <div className={styles.twoColumnCharts}>
        <SimpleBarChart
          title={`New Customers (${monthRangeLabel})`}
          data={newCustomersByMonth}
          color="blue"
        />
        <SimpleBarChart
          title={`Customer Churn (${monthRangeLabel})`}
          data={churnCustomersByMonth}
          color="pink"
        />
      </div>

      <div className={styles.chartCard}>
        <h3>Instructor Class Attendance</h3>
        <div className={styles.instructorFilters}>
          <InputField
            type="search"
            value={instructorSearch}
            onChange={(event) => setInstructorSearch(event.target.value)}
            className={styles.instructorSearchInput}
            placeholder="Search instructor name"
            required={false}
          />
          <div className={styles.englishBackgroundFilterGroup}>
            {[
              { value: "all", label: "All" },
              { value: "non-native", label: "Non Native" },
              { value: "native-a", label: "Native A" },
              { value: "native-b", label: "Native B" },
            ].map((option) => (
              <RadioButton
                key={option.value}
                name="instructor-english-background-filter"
                value={option.value}
                checked={englishBackgroundFilter === option.value}
                onChange={(event) =>
                  setEnglishBackgroundFilter(
                    event.target.value as EnglishBackgroundFilter,
                  )
                }
                label={option.label}
                className={styles.englishBackgroundRadio}
              />
            ))}
          </div>
        </div>
        <div className={styles.instructorPickerScrollableArea}>
          <div className={styles.instructorPickerGrid}>
            {filteredInstructors.map((item) => (
              <button
                type="button"
                key={item.id}
                className={styles.instructorPickerItem}
                onClick={() => setSelectedInstructor(item)}
              >
                <InstructorAvatar
                  imageUrl={item.imageUrl}
                  nickname={item.nickname}
                  englishBackgroundClass={item.englishBackgroundClass}
                />
                <span>{item.nickname}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedInstructor)}
        onClose={() => setSelectedInstructor(null)}
        overlayClosable
      >
        {selectedInstructor ? (
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedInstructor.nickname} attendance details`}
          >
            <div className={styles.modalHeader}>
              <h3>
                Monthly Class Attendance Results ({selectedInstructor.nickname})
              </h3>
            </div>

            <div className={styles.attendanceTableWrapper}>
              <table className={styles.attendanceTable}>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Month</th>
                    <th>Trial</th>
                    <th>Regular</th>
                    <th>Cancel</th>
                    <th>Cancel Without Notice</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInstructor.monthly.map((monthItem) => (
                    <tr key={`${monthItem.year}-${monthItem.month}`}>
                      <td>{monthItem.year}</td>
                      <td>{monthItem.month}</td>
                      <td>{monthItem.trialLessons}</td>
                      <td>{monthItem.regularLessons}</td>
                      <td>{monthItem.cancelLessons}</td>
                      <td>{monthItem.cancelWithoutNoticeLessons}</td>
                      <td>{monthItem.attendanceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
