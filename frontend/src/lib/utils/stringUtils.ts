export const getLocalizedText = (
  text: string,
  language: LanguageType,
): string => {
  const [ja, en] = text.split(" / ");
  if (!ja || !en) return text;

  return language === "ja" ? ja : en;
};
