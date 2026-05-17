"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { useNotificationStore } from "@/stores/notificationStore";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const { notifications, markAllRead, unreadCount } = useNotificationStore();

  return (
    <Sheet>
      <SheetTrigger className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>{t("title")}</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-green-600">
              {t("markAllRead")}
            </Button>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noNotifications")}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-3 rounded-xl border transition-colors",
                  n.read ? "bg-white border-gray-100" : "bg-green-50 border-green-100"
                )}
              >
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ko })}
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
