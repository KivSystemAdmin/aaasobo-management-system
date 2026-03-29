"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/elements/modal/Modal";
import styles from "./MessageBoardPanel.module.scss";

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

  useEffect(() => {
    localStorage.setItem(storageKey, isOpen ? "open" : "closed");
  }, [isOpen, storageKey]);

  if (!latestPost) return null;

  return (
    <>
      <section className={styles.messageBanner}>
        <div className={styles.headerRow}>
          <h3>Message Board</h3>
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
            <time>{new Date(latestPost.createdAt).toLocaleString()}</time>
            {posts.length > 1 ? (
              <button type="button" onClick={() => setIsHistoryOpen(true)}>
                View past messages
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        overlayClosable
      >
        <div className={styles.messageModalContent}>
          <h3>Message Board History</h3>
          <ul>
            {posts.map((post) => (
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
