"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface LanguageContextProps {
  language: LanguageType;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(
  undefined,
);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Keep the server render and the first client render identical. Browser
  // language detection can only safely affect a subsequent client render.
  const [language, setLanguage] = useState<LanguageType>("en");

  useEffect(() => {
    const detectionTimer = window.setTimeout(() => {
      setLanguage(navigator.language.startsWith("ja") ? "ja" : "en");
    }, 0);

    return () => window.clearTimeout(detectionTimer);
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ja" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    console.error(
      "Warning: useLanguage was called outside of a LanguageProvider.",
    );
    return { language: "en" as LanguageType, toggleLanguage: () => {} };
  }

  return context;
};
