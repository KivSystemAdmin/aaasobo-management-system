"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Modal from "@/components/elements/modal/Modal";
import styles from "./MessageBoardPanel.module.scss";
import { MegaphoneIcon } from "@heroicons/react/24/outline";

type MessageBoardPanelProps = {
  posts: MessageBoardPostItem[];
  storageKey: string;
};

export default function MessageBoardPanel({
  posts,
  storageKey,
}: MessageBoardPanelProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(storageKey) !== "closed";
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const latestPost = posts[0] ?? null;
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

  if (!latestPost) return null;

  return (
    <>
      <section className={styles.messageBanner}>
        <div className={styles.headerRow}>
          <h3>
            <MegaphoneIcon className={styles.icon} />
            {language === "en" ? "Announcements" : "お知らせ"}
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
            <time>{formatDate(latestPost.createdAt)}</time>
            {posts.length > 1 ? (
              <button type="button" onClick={() => setIsHistoryOpen(true)}>
                {language === "en"
                  ? "View past messages"
                  : "過去のメッセージを表示"}
              </button>
            ) : null}
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
