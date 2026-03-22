"use client";

import { useState, useEffect } from "react";
import styles from "./InstructorSelection.module.scss";
import InstructorItem from "./InstructorItem";
import { getInstructorProfilesByEnglishBackground } from "@/lib/api/instructorsApi";
import { EnglishBackground } from "@/types";

interface InstructorSelectionProps {
  onInstructorSelect: (instructor: InstructorRebookingProfile) => void;
  plan?: Plan;
  language: LanguageType;
  availableInstructors?: InstructorRebookingProfile[]; // Pre-filtered instructors for date-first flow
}

export default function InstructorSelection({
  onInstructorSelect,
  plan,
  language,
  availableInstructors,
}: InstructorSelectionProps) {
  const [instructors, setInstructors] = useState<InstructorRebookingProfile[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchInstructors = async () => {
      // If availableInstructors is provided (date-first flow), use that
      if (availableInstructors) {
        setInstructors(availableInstructors);
        setLoading(false);
        return;
      }

      // Otherwise fetch native or non native instructors according to the plan (instructor-first flow)
      try {
        setLoading(true);
        setError(null);

        switch (plan?.englishBackground) {
          case EnglishBackground.NonNative:
            const nonNativeInstructorProfiles =
              await getInstructorProfilesByEnglishBackground(
                EnglishBackground.NonNative,
              );
            setInstructors(nonNativeInstructorProfiles);
            break;
          case EnglishBackground.NativeA:
            const nativeAInstructorProfiles =
              await getInstructorProfilesByEnglishBackground(
                EnglishBackground.NativeA,
              );
            setInstructors(nativeAInstructorProfiles);
            break;
          case EnglishBackground.NativeB:
            const nativeBInstructorProfiles =
              await getInstructorProfilesByEnglishBackground(
                EnglishBackground.NativeB,
              );
            setInstructors(nativeBInstructorProfiles);
            break;
        }
      } catch (err) {
        console.error("Failed to fetch instructors:", err);
        setError(
          language === "ja"
            ? "講師の取得に失敗しました"
            : "Failed to load instructors",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, [language, availableInstructors, plan?.englishBackground]);

  const filteredInstructors = instructors.filter((instructor) =>
    instructor.nickname.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const searchPlaceholder =
    language === "ja" ? "講師名で検索..." : "Search instructors...";

  if (loading) {
    return (
      <div className={styles.instructorSelection}>
        <div className={styles.loading}>
          {language === "ja" ? "講師を読み込み中..." : "Loading instructors..."}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.instructorSelection}>
        <div className={styles.error}>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            {language === "ja" ? "再試行" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.instructorSelection}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.instructorGrid}>
        {filteredInstructors.length > 0 ? (
          filteredInstructors.map((instructor) => (
            <InstructorItem
              key={instructor.id}
              instructor={instructor}
              onSelect={onInstructorSelect}
              language={language}
              isAvailable={true}
            />
          ))
        ) : (
          <div className={styles.noResults}>
            {language === "ja"
              ? "該当する講師が見つかりません"
              : "No instructors found"}
          </div>
        )}
      </div>
    </div>
  );
}
