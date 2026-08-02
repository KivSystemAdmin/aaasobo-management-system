import { EnglishBackground } from "@/types";

export { EnglishBackground };

export const ENGLISH_BACKGROUND_LABELS: Record<EnglishBackground, string> = {
  [EnglishBackground.NonNative]: "Program Original",
  [EnglishBackground.NativeA]: "Native A",
  [EnglishBackground.NativeB]: "Native B",
};

export const ENGLISH_BACKGROUND_LABELS_JP: Record<EnglishBackground, string> = {
  [EnglishBackground.NonNative]: "プログラムオリジナル",
  [EnglishBackground.NativeA]: "ネイティブA",
  [EnglishBackground.NativeB]: "ネイティブB",
};
