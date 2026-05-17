import type { IngredientCategory } from "@/types/database";

export const CATEGORY_LABELS: Record<IngredientCategory, { ko: string; en: string; icon: string }> = {
  refrigerated: { ko: "냉장", en: "Refrigerated", icon: "🧊" },
  frozen: { ko: "냉동", en: "Frozen", icon: "❄️" },
  room_temp: { ko: "상온", en: "Room Temp", icon: "🌡️" },
  beverage: { ko: "음료", en: "Beverage", icon: "🥤" },
  condiment: { ko: "양념/소스", en: "Condiment", icon: "🧂" },
  snack: { ko: "과자/간식", en: "Snack", icon: "🍪" },
  other: { ko: "기타", en: "Other", icon: "📦" },
};

export const UNIT_OPTIONS = ["개", "g", "kg", "ml", "L", "봉", "캔", "병", "팩", "묶음"];

export function getCategoryLabel(category: IngredientCategory, locale: string = "ko"): string {
  return locale === "ko" ? CATEGORY_LABELS[category].ko : CATEGORY_LABELS[category].en;
}
