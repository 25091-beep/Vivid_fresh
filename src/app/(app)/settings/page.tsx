"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bell, Globe, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNotificationSettings } from "@/stores/settingsStore";

type PushStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tNotif = useTranslations("notifications");
  const [locale, setLocale] = useState<"ko" | "en">("ko");
  const { settings, updateSetting } = useNotificationSettings();
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");

  useEffect(() => {
    const savedLocale = document.cookie.match(/locale=([^;]+)/)?.[1] as "ko" | "en" | undefined;
    if (savedLocale) setLocale(savedLocale);

    if (!("Notification" in window)) {
      setPushStatus("unsupported");
    } else if (Notification.permission === "granted") {
      setPushStatus("granted");
    } else if (Notification.permission === "denied") {
      setPushStatus("denied");
    }
  }, []);

  const switchLocale = (newLocale: "ko" | "en") => {
    setLocale(newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const requestPushPermission = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("이 브라우저는 알림을 지원하지 않아요");
      setPushStatus("unsupported");
      return;
    }

    setPushStatus("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        toast.error(tNotif("pushDenied"));
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        // VAPID 키 없이도 브라우저 알림 허용만 처리
        setPushStatus("granted");
        toast.success(tNotif("pushEnabled"));
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setPushStatus("granted");
      toast.success(tNotif("pushEnabled"));
    } catch (err) {
      console.error("Push subscription failed:", err);
      setPushStatus("denied");
      toast.error("알림 등록에 실패했어요");
    }
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Profile */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="text-xl bg-green-100 text-green-700">👤</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">데모 사용자</p>
            <p className="text-sm text-gray-400">vivifresh.local</p>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {t("notifications")}
        </h3>
        <Card className="divide-y divide-gray-50">
          {/* Push 허용 버튼 */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{tNotif("enablePush")}</p>
              <p className="text-xs text-gray-400">
                {pushStatus === "unsupported"
                  ? "이 브라우저는 지원하지 않아요"
                  : "브라우저 알림 허용"}
              </p>
            </div>
            {pushStatus === "granted" ? (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <Check className="w-4 h-4" /> 허용됨
              </span>
            ) : pushStatus === "denied" ? (
              <span className="text-xs text-red-400">차단됨</span>
            ) : (
              <Button
                size="sm"
                onClick={requestPushPermission}
                disabled={pushStatus === "loading" || pushStatus === "unsupported"}
                className="bg-green-600 hover:bg-green-700"
              >
                {pushStatus === "loading" ? "처리중..." : "허용하기"}
              </Button>
            )}
          </div>

          <Separator />

          {/* 알림 기준 설정 */}
          {(["d7", "d3", "d1", "d0"] as const).map((key) => (
            <div key={key} className="p-4 flex items-center justify-between">
              <Label htmlFor={key} className="text-sm cursor-pointer">
                {tNotif(key)}
              </Label>
              <Switch
                id={key}
                checked={settings[key]}
                onCheckedChange={(v) => updateSetting(key, v)}
              />
            </div>
          ))}
        </Card>
      </div>

      {/* Language */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t("language")}
        </h3>
        <Card className="p-1 flex gap-1">
          {(["ko", "en"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => switchLocale(lang)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                locale === lang
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {lang === "ko" ? "🇰🇷 한국어" : "🇺🇸 English"}
            </button>
          ))}
        </Card>
      </div>

      {/* 로컬 저장소 안내 */}
      <Card className="p-4 bg-blue-50 border-blue-100">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-medium">데이터 저장 방식</p>
            <p>모든 데이터는 이 기기의 브라우저 로컬스토리지에 저장됩니다. 브라우저 데이터를 삭제하면 초기화돼요.</p>
          </div>
        </div>
      </Card>

      {/* App Info */}
      <Card className="p-4 space-y-2 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>버전</span>
          <span className="font-medium text-gray-700">v0.1.0-prototype</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span>앱 이름</span>
          <span className="font-medium text-gray-700">Vivid Fresh</span>
        </div>
      </Card>
    </div>
  );
}
