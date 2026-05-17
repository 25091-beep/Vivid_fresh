"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from "next/link";

type NavKey = "home" | "ingredients" | "recipes" | "groups" | "settings";

const PAGE_NAV_KEYS: Record<string, NavKey | "brand"> = {
  "/dashboard": "brand",
  "/ingredients": "ingredients",
  "/recipes": "recipes",
  "/groups": "groups",
  "/settings": "settings",
};

export function TopBar() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  const matchedPath = Object.keys(PAGE_NAV_KEYS).find(
    (key) => pathname === key || pathname.startsWith(key + "/")
  );
  const titleKey = matchedPath ? PAGE_NAV_KEYS[matchedPath] : "brand";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {titleKey === "brand" ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">🥬</span>
            <span className="text-lg font-bold text-green-600">Vivid Fresh</span>
          </div>
        ) : (
          <h1 className="text-lg font-bold text-gray-900">
            {tNav(titleKey)}
          </h1>
        )}
      </div>
      <NotificationBell />
    </header>
  );
}
