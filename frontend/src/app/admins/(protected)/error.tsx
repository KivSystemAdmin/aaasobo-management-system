"use client";

import ErrorPage from "@/components/elements/errorPage/ErrorPage";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();
  const [messageEn, messageJa] = error.message.split(" / ");
  const errorMessages = { messageEn, messageJa: messageJa || messageEn };

  return (
    <ErrorPage
      reset={reset}
      errorMessages={errorMessages}
      language={language}
    />
  );
}
