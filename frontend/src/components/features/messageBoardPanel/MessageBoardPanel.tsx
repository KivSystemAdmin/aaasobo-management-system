"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Modal from "@/components/elements/modal/Modal";
import styles from "./MessageBoardPanel.module.scss";
import { HandThumbUpIcon, MegaphoneIcon } from "@heroicons/react/24/outline";

type MessageBoardPanelProps = {
  posts: MessageBoardPostItem[];
  storageKey: string;
  readMessageStorageKey: string;
  adminId?: number;
};

export default function MessageBoardPanel({
  posts,
  storageKey,
  readMessageStorageKey,
  adminId,
}: MessageBoardPanelProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(storageKey) !== "closed";
  });
  const [readMessageNumber, setReadMessageNumber] = useState<number | null>(
    () => {
      if (typeof window === "undefined") return null;

      const storedReadMessageNumber = localStorage.getItem(
        readMessageStorageKey,
      );
      if (!storedReadMessageNumber) return null;

      const parsedReadMessageNumber = Number(storedReadMessageNumber);
      return Number.isNaN(parsedReadMessageNumber)
        ? null
        : parsedReadMessageNumber;
    },
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const latestPost = posts[0] ?? null;
  const hasReadLatestMessage =
    latestPost !== null &&
    readMessageNumber !== null &&
    readMessageNumber >= latestPost.id;
  const { language } = useLanguage();
  const formatDate = (value: string) => {
    const date = new Date(value);

    if (language === "ja") {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  useEffect(() => {
    localStorage.setItem(storageKey, isOpen ? "open" : "closed");
  }, [isOpen, storageKey]);

  const handleReadReactionClick = () => {
    if (!latestPost) return;

    localStorage.setItem(readMessageStorageKey, String(latestPost.id));
    setReadMessageNumber(latestPost.id);
  };

  if (!latestPost) return null;

  return (
    <>
      <section className={styles.messageBanner}>
        <div className={styles.headerRow}>
          <h3>
            <MegaphoneIcon className={styles.icon} />
            {language === "en" ? "Announcements" : "お知らせ"}{" "}
            {!hasReadLatestMessage ? (
              <span className={styles.newMessageNotification}>
                ({language === "en" ? "New message" : "新着メッセージ"})
              </span>
            ) : null}
          </h3>

          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={
              isOpen ? "Collapse message board" : "Expand message board"
            }
          >
            {isOpen ? "-" : "＋"}
          </button>
        </div>
        {isOpen ? (
          <div className={styles.body}>
            <p>{latestPost.body}</p>
            <div className={styles.footerRow}>
              <div>
                <time>{formatDate(latestPost.createdAt)}</time>
                <button
                  type="button"
                  disabled={adminId !== undefined}
                  className={`${styles.readReactionButton} ${
                    hasReadLatestMessage ? styles.hasRead : ""
                  }`}
                  onClick={handleReadReactionClick}
                  aria-label={
                    language === "en"
                      ? "Mark newest announcement as read"
                      : "最新のお知らせを既読にする"
                  }
                >
                  <HandThumbUpIcon />
                </button>
                {!hasReadLatestMessage ? (
                  <span className={styles.markAsRead}>
                    ({language === "en" ? "Mark as read" : "既読にする"})
                  </span>
                ) : (
                  <span className={styles.hasRead}>
                    ({language === "en" ? "Has read" : "既読"})
                  </span>
                )}
              </div>
              {posts.length > 1 ? (
                <button
                  type="button"
                  className={styles.pastMessagesButton}
                  onClick={() => setIsHistoryOpen(true)}
                >
                  {language === "en"
                    ? "View past messages"
                    : "過去のメッセージを表示"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        overlayClosable={false}
      >
        <div className={styles.messageModalContent}>
          <h3>{language === "en" ? "Message History" : "メッセージ履歴"}</h3>
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <p>{post.body}</p>
                <time>{formatDate(post.createdAt)}</time>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
