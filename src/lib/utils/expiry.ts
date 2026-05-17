import { differenceInDays, parseISO, isValid } from "date-fns";

export type ExpiryStatus = "expired" | "critical" | "warning" | "soon" | "ok";

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = parseISO(expiryDate);
  if (!isValid(expiry)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(expiry, today);
}

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return "expired";
  if (days === 0) return "critical";
  if (days <= 1) return "critical";
  if (days <= 3) return "warning";
  if (days <= 7) return "soon";
  return "ok";
}

export function getExpiryLabel(expiryDate: string, locale: string = "ko"): string {
  const days = getDaysUntilExpiry(expiryDate);
  if (locale === "ko") {
    if (days < 0) return `${Math.abs(days)}일 초과`;
    if (days === 0) return "오늘 만료";
    if (days === 1) return "내일 만료";
    return `D-${days}`;
  } else {
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";
    return `D-${days}`;
  }
}

export function getExpiryColorClass(status: ExpiryStatus): string {
  switch (status) {
    case "expired":
      return "bg-red-100 text-red-700 border-red-200";
    case "critical":
      return "bg-red-50 text-red-600 border-red-100";
    case "warning":
      return "bg-orange-50 text-orange-600 border-orange-100";
    case "soon":
      return "bg-yellow-50 text-yellow-600 border-yellow-100";
    case "ok":
      return "bg-green-50 text-green-600 border-green-100";
  }
}

export function getExpiryBadgeVariant(status: ExpiryStatus) {
  switch (status) {
    case "expired":
    case "critical":
      return "destructive" as const;
    case "warning":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}
