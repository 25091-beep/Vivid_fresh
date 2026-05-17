import { NextRequest, NextResponse } from "next/server";

interface Ingredient {
  id: string;
  name: string;
  expiry_date: string;
}

interface NotificationSettings {
  d7: boolean;
  d3: boolean;
  d1: boolean;
  d0: boolean;
}

interface CheckedNotification {
  ingredientId: string;
  ingredientName: string;
  type: "d7" | "d3" | "d1" | "d0" | "expired";
  message: string;
}

function getDaysUntil(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// POST /api/notifications/check
// Body: { ingredients: Ingredient[], settings: NotificationSettings }
export async function POST(request: NextRequest) {
  try {
    const { ingredients, settings } = (await request.json()) as {
      ingredients: Ingredient[];
      settings: NotificationSettings;
    };

    if (!ingredients?.length) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications: CheckedNotification[] = [];

    for (const ingredient of ingredients) {
      const days = getDaysUntil(ingredient.expiry_date);

      let type: CheckedNotification["type"] | null = null;
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

      if (type) {
        notifications.push({
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          type,
          message,
        });
      }
    }

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("Notification check error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
