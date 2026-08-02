"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { UserIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import styles from "./DashboardClient.module.scss";
import {
  ENGLISH_BACKGROUND_LABELS,
  EnglishBackground,
} from "@/lib/data/englishBackground";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { defaultUserImageUrl } from "@/lib/data/data";
import Modal from "@/components/elements/modal/Modal";
import InputField from "@/components/elements/inputField/InputField";
import RadioButton from "@/components/elements/radioButton/RadioButton";
import TextAreaInput from "@/components/elements/textAreaInput/TextAreaInput";
import {
  createMessageBoardPostAction,
  type MessageBoardActionState,
} from "@/app/actions/messageBoard";
import { confirmAlert } from "@/lib/utils/alertUtils";
import { MessageTarget } from "@/types";

const messageTargetLabel: Record<MessageTarget, string> = {
  [MessageTarget.customer]: "お客さま",
  [MessageTarget.instructor]: "インストラクター",
  [MessageTarget.both]: "お客さま & インストラクター",
};

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
  recentMessages: initialRecentMessages,
}: {
  metrics: DashboardMetric;
  monthRangeLabel: string;
  newCustomersByMonth: MonthlyData[];
  churnCustomersByMonth: MonthlyData[];
  attendanceByMonth: MonthlyData[];
  instructorAttendance: InstructorAttendanceItem[];
  recentMessages: MessageItem[];
}) {
  const [target, setTarget] = useState<MessageTarget>(MessageTarget.customer);
  const [message, setMessage] = useState("");
  const [recentMessages, setRecentMessages] = useState<MessageItem[]>(
    initialRecentMessages,
  );
  const [isRecentMessagesModalOpen, setIsRecentMessagesModalOpen] =
    useState(false);
  const [isMessageBoardOpen, setIsMessageBoardOpen] = useState(true);
  const hasLoadedMessageBoardOpenState = useRef(false);
  const [selectedInstructor, setSelectedInstructor] =
    useState<InstructorAttendanceItem | null>(null);
  const [instructorSearch, setInstructorSearch] = useState("");
  const [englishBackgroundFilter, setEnglishBackgroundFilter] =
    useState<EnglishBackgroundFilter>("all");
  const [, setCreateMessageResultState] = useState<
    MessageBoardActionState | undefined
  >(undefined);

  const normalizedSearch = instructorSearch.trim().toLowerCase();
  const latestMessage = useMemo(
    () => recentMessages[0] ?? null,
    [recentMessages],
  );
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

  useEffect(() => {
    const savedOpenState = localStorage.getItem(
      "adminDashboardMessageBoardOpenState",
    );

    queueMicrotask(() => {
      setIsMessageBoardOpen(savedOpenState !== "closed");
      hasLoadedMessageBoardOpenState.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedMessageBoardOpenState.current) return;

    localStorage.setItem(
      "adminDashboardMessageBoardOpenState",
      isMessageBoardOpen ? "open" : "closed",
    );
  }, [isMessageBoardOpen]);

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
      return;
    }

    let confirmed = false;
    confirmed = await confirmAlert(
      `送信前にメッセージ内容をご確認ください:
      "${message.trim()}" ( for ${messageTargetLabel[target]} )`,
    );
    if (!confirmed) return;

    const result = await createMessageBoardPostAction({
      target,
      body: message.trim(),
    });

    setCreateMessageResultState(result);

    if (result.errorMessage) {
      toast.error(result.errorMessage);
      return;
    }

    const createdMessage = result.message;
    if (createdMessage) {
      setRecentMessages((prev) => [createdMessage, ...prev].slice(0, 20));
      setMessage("");
    }

    toast.success(result.successMessage ?? "メッセージ送信成功しました。");
  };

  return (
    <section className={styles.dashboardContainer}>
      <div className={styles.messageBoardCard}>
        <div className={styles.messageHeader}>
          <h3>メッセージボード</h3>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setIsMessageBoardOpen((prev) => !prev)}
            aria-label={
              isMessageBoardOpen
                ? "Collapse message board"
                : "Expand message board"
            }
          >
            {isMessageBoardOpen ? "-" : "+"}
          </button>
        </div>

        {isMessageBoardOpen ? (
          <div className={styles.messageBoardContent}>
            <form onSubmit={submitMessage} className={styles.messageForm}>
              <div className={styles.segmentedControl}>
                {(
                  [
                    MessageTarget.customer,
                    MessageTarget.instructor,
                    MessageTarget.both,
                  ] as const
                ).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={target === option ? styles.activeTarget : ""}
                    onClick={() => setTarget(option)}
                  >
                    {messageTargetLabel[option]}
                    {"宛"}
                  </button>
                ))}
              </div>
              <TextAreaInput
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="メッセージを入力してください..."
                unstyled
                withLabelWrapper={false}
                containerClassName={styles.messageTextAreaField}
                inputWrapperClassName={styles.messageTextAreaWrapper}
                inputClassName={styles.messageTextAreaInput}
              />
              <div className={styles.messageActions}>
                <button type="submit">送信</button>
              </div>
            </form>

            <aside className={styles.messageHistory}>
              <h3>最近のメッセージ</h3>
              {recentMessages.length === 0 ? (
                <p className={styles.emptyText}>
                  送信されたメッセージはありません。
                </p>
              ) : (
                <div className={styles.messagePreview}>
                  {latestMessage ? (
                    <article>
                      <strong>
                        {messageTargetLabel[latestMessage.target]}
                      </strong>
                      <p>{latestMessage.body}</p>
                      <time>{formatDate(latestMessage.createdAt)}</time>
                    </article>
                  ) : null}
                  <button
                    type="button"
                    className={styles.historyButton}
                    onClick={() => setIsRecentMessagesModalOpen(true)}
                  >
                    全メッセージを見る
                  </button>
                </div>
              )}
            </aside>
          </div>
        ) : null}
      </div>
      <Modal
        isOpen={isRecentMessagesModalOpen}
        onClose={() => setIsRecentMessagesModalOpen(false)}
        overlayClosable={false}
      >
        <div className={styles.recentMessagesModal}>
          <header className={styles.recentMessagesModalHeader}>
            <h3>メッセージ履歴</h3>
          </header>
          {recentMessages.length === 0 ? (
            <p className={styles.emptyText}>
              投稿されたメッセージはありません。
            </p>
          ) : (
            <ul className={styles.recentMessagesList}>
              {recentMessages.map((item) => (
                <li key={item.id} className={styles.recentMessageItem}>
                  <article>
                    <div className={styles.recentMessageMeta}>
                      <span className={styles.recentMessageTarget}>
                        {messageTargetLabel[item.target]} {"宛"}
                      </span>
                      <time>{formatDate(item.createdAt)}</time>
                    </div>
                    <p>{item.body}</p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <UserGroupIcon className={styles.kpiIcon} />
          <div>
            <p>お客さま</p>
            <div className={styles.kpiValue}>
              <strong>{metrics.totalCustomers}</strong> <span>名</span>
            </div>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <UserGroupIcon className={styles.kpiIcon} />
          <div>
            <p>お子さま</p>
            <div className={styles.kpiValue}>
              <strong>{metrics.totalChildren}</strong> <span>名</span>
            </div>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <UserGroupIcon className={styles.kpiIcon} />
          <div>
            <p>インストラクター</p>
            <div className={styles.kpiValue}>
              <strong>
                {metrics.instructorsByEnglishBackground.nonNative +
                  metrics.instructorsByEnglishBackground.nativeA +
                  metrics.instructorsByEnglishBackground.nativeB}
              </strong>
              <span>名</span>
            </div>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <UserIcon className={styles.kpiIcon} />
          <div>
            <p>{ENGLISH_BACKGROUND_LABELS[EnglishBackground.NonNative]}</p>
            <strong>{metrics.instructorsByEnglishBackground.nonNative}</strong>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <UserIcon className={styles.kpiIcon} />
          <div>
            <p>{ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeA]}</p>
            <strong>{metrics.instructorsByEnglishBackground.nativeA}</strong>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <UserIcon className={styles.kpiIcon} />
          <div>
            <p>{ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeB]}</p>
            <article>
              <strong>{metrics.instructorsByEnglishBackground.nativeB}</strong>
              <span>名</span>
            </article>
          </div>
        </article>
      </div>

      <div className={styles.twoColumnCharts}>
        <SimpleBarChart
          title={`入会者数 (${monthRangeLabel})`}
          data={newCustomersByMonth}
          color="blue"
        />
        <SimpleBarChart
          title={`退会者数 (${monthRangeLabel})`}
          data={churnCustomersByMonth}
          color="pink"
        />
      </div>

      <div className={styles.chartCard}>
        <h3>インストラクタークラス出席状況</h3>
        <div className={styles.instructorFilters}>
          <InputField
            type="search"
            value={instructorSearch}
            onChange={(event) => setInstructorSearch(event.target.value)}
            className={styles.instructorSearchInput}
            placeholder="インストラクターを検索"
            required={false}
          />
          <div className={styles.englishBackgroundFilterGroup}>
            {[
              { value: "all", label: "All" },
              {
                value: "non-native",
                label: ENGLISH_BACKGROUND_LABELS[EnglishBackground.NonNative],
              },
              {
                value: "native-a",
                label: ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeA],
              },
              {
                value: "native-b",
                label: ENGLISH_BACKGROUND_LABELS[EnglishBackground.NativeB],
              },
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
              <h3>月別クラス出席率 ({selectedInstructor.nickname})</h3>
            </div>

            <div className={styles.attendanceTableWrapper}>
              <table className={styles.attendanceTable}>
                <thead>
                  <tr>
                    <th>年</th>
                    <th>月</th>
                    <th>無料クラス開催数</th>
                    <th>レギュラークラス開催数</th>
                    <th>キャンセル数</th>
                    <th>連絡なしキャンセル数</th>
                    <th>出席率</th>
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
