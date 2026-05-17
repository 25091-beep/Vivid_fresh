import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationSettings {
  d7: boolean;
  d3: boolean;
  d1: boolean;
  d0: boolean;
  notify_time: string;
}

interface SettingsStore {
  settings: NotificationSettings;
  updateSetting: (key: keyof NotificationSettings, value: boolean | string) => void;
}

export const useNotificationSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        d7: true,
        d3: true,
        d1: true,
        d0: true,
        notify_time: "09:00",
      },
      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
    }),
    { name: "vivifresh-settings" }
  )
);
