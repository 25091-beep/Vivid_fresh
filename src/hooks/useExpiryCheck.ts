"use client";

import { useEffect, useRef } from "react";
import { useIngredientStore } from "@/stores/ingredientStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useNotificationSettings } from "@/stores/settingsStore";
import { getDaysUntilExpiry } from "@/lib/utils/expiry";

const LAST_CHECK_KEY = "vivifresh-last-check";

export function useExpiryCheck() {
  const ingredients = useIngredientStore((s) => s.ingredients);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { settings } = useNotificationSettings();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const today = new Date().toISOString().split("T")[0];
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);

    // 하루에 한 번만 체크
    if (lastCheck === today) return;

    const existingNotifs = useNotificationStore.getState().notifications;
    const todayNotifIds = new Set(
      existingNotifs
        .filter((n) => n.created_at.startsWith(today))
        .map((n) => `${n.ingredient_id}-${n.type}`)
    );

    for (const ingredient of ingredients) {
      const days = getDaysUntilExpiry(ingredient.expiry_date);

      let type: "d7" | "d3" | "d1" | "d0" | "expired" | null = null;
      let message = "";

      if (days < 0) {
        type = "expired";
        message = `${ingredient.name}의 유통기한이 ${Math.abs(days)}일 지났어요`;
      } else if (days === 0 && settings.d0) {
        type = "d0";
        message = `${ingredient.name}의 유통기한이 오늘이에요!`;
      } else if (days === 1 && settings.d1) {
        type = "d1";
        message = `${ingredient.name}의 유통기한이 내일이에요`;
      } else if (days <= 3 && settings.d3) {
        type = "d3";
        message = `${ingredient.name}의 유통기한이 ${days}일 남았어요`;
      } else if (days <= 7 && settings.d7) {
        type = "d7";
        message = `${ingredient.name}의 유통기한이 1주일 남았어요`;
      }

      if (type && !todayNotifIds.has(`${ingredient.id}-${type}`)) {
        addNotification({
          user_id: "local",
          ingredient_id: ingredient.id,
          type,
          message,
          read: false,
        });
      }
    }

    localStorage.setItem(LAST_CHECK_KEY, today);
  }, [ingredients, settings, addNotification]);
}
